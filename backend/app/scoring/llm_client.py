from __future__ import annotations

import hashlib
import json
import time
from typing import Any, Dict, Tuple
from pathlib import Path
from datetime import datetime, timezone

from cachetools import TTLCache
from jsonschema import validate, ValidationError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from loguru import logger

from app.scoring.llm_config import get_llm_config
from app.scoring.prompts import build_messages
from app.scoring.schemas import SCORING_JSON_SCHEMA, OPENAI_RESPONSE_FORMAT

# Providers
try:  # defer imports so tests can mock easily
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

try:
    from groq import Groq  # type: ignore
except Exception:  # pragma: no cover
    Groq = None  # type: ignore


_cache = TTLCache(maxsize=1024, ttl=300)

def clear_scoring_cache():
    """Clear the scoring cache to ensure fresh results"""
    global _cache
    _cache.clear()
    from loguru import logger
    logger.info("[scoring] Cache cleared for fresh scoring results")

# Runtime gating if provider repeatedly fails
_LLM_DISABLED = False
_LAST_ERROR: str | None = None
_CONFIG_LOGGED = False



def reset_llm_gate():
    """Reset the in-process LLM failure gate (used at the start of each Celery task)."""
    global _LLM_DISABLED, _LAST_ERROR
    _LLM_DISABLED = False
    _LAST_ERROR = None


class ProviderError(Exception):
    pass


class ValidationFailed(Exception):
    pass


def _mask_pii(text: str) -> str:
    # naive masking for emails/phones
    text = text.replace("@", "[at]")
    return text


def _cache_key(payload: Dict[str, Any]) -> str:
    m = hashlib.sha256()
    m.update(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8"))
    return m.hexdigest()


def _write_scoring_log(kind: str, data: Any) -> None:
    """Append JSON formatted logs to backend/logs/scoring.log and mirror to ai_analysis_<date>.log. Best-effort; never raise."""
    try:
        base_dir = Path(__file__).resolve().parents[2]  # backend/
        log_dir = base_dir / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        # Create JSON log entry
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": "INFO",
            "event_type": "ai_scoring_log",
            "log_kind": kind.lower(),
        }

        # Add the data to the log entry
        if isinstance(data, dict):
            log_entry.update(data)
        elif isinstance(data, str):
            log_entry["message"] = data
        else:
            log_entry["data"] = data

        # Convert to JSON string
        try:
            json_line = json.dumps(log_entry, ensure_ascii=False, default=str)
        except Exception:
            # Fallback if JSON serialization fails
            log_entry["data"] = str(data)
            json_line = json.dumps(log_entry, ensure_ascii=False, default=str)

        # Write to scoring.log
        with (log_dir / "scoring.log").open("a", encoding="utf-8") as f:
            f.write(json_line + "\n")

        # Mirror to ai_analysis_<date>.log
        today = datetime.now(timezone.utc).date().isoformat()
        with (log_dir / f"ai_analysis_{today}.log").open("a", encoding="utf-8") as f2:
            f2.write(json_line + "\n")

    except Exception:
        # swallow any file I/O errors silently
        pass


class LLMClient:
    def __init__(self) -> None:
        self.cfg = get_llm_config()
        # update cache ttl from settings if present
        try:
            from app.core.config import settings

            ttl = int(getattr(settings, "CACHE_TTL_SECONDS", 300) or 300)
            _cache.ttl = ttl  # type: ignore[attr-defined]
        except Exception:
            pass

        if self.cfg.provider == "openai" and OpenAI is not None:
            self.client = OpenAI(api_key=self.cfg.api_key, base_url=self.cfg.base_url)
        elif self.cfg.provider == "groq" and Groq is not None:
            self.client = Groq(api_key=self.cfg.api_key)
        else:
            self.client = None

        # Log active config once per process for debugging
        global _CONFIG_LOGGED
        if not _CONFIG_LOGGED:
            logger.info(f"[scoring] LLM config provider={self.cfg.provider} base_url={self.cfg.base_url} model={self.cfg.model} key_present={'yes' if bool(self.cfg.api_key) else 'no'}")
            _CONFIG_LOGGED = True

    def _obs(self, start: float, cache_hit: bool, extra: Dict[str, Any] | None = None) -> Dict[str, Any]:
        obs = {
            "provider": self.cfg.provider,
            "model": self.cfg.model,
            "cache_hit": cache_hit,
            "duration_ms": int((time.time() - start) * 1000),
        }
        if extra:
            obs.update(extra)
        return obs

    def _call_openai(self, messages: Any) -> str:
        assert self.client is not None
        response = self.client.chat.completions.create(
            model=self.cfg.model,
            messages=messages,
            temperature=self.cfg.temperature,
            max_tokens=self.cfg.max_tokens,
            top_p=1,
            response_format=OPENAI_RESPONSE_FORMAT,  # strict json schema
        )
        return response.choices[0].message.content or "{}"

    def _call_groq(self, messages: Any) -> str:
        assert self.client is not None
        # Groq may not support json_schema; use json_object and validate ourselves
        response = self.client.chat.completions.create(
            model=self.cfg.model,
            messages=messages,
            temperature=self.cfg.temperature,
            max_tokens=self.cfg.max_tokens,
            top_p=1,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content or "{}"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(ProviderError),
        reraise=True,
    )
    def _invoke(self, messages: Any) -> str:
        global _LLM_DISABLED, _LAST_ERROR
        if _LLM_DISABLED:
            raise ProviderError(f"LLM disabled due to prior failures: {_LAST_ERROR}")
        try:
            if self.client is None:
                raise ProviderError("No client for provider")
            if self.cfg.provider == "openai":
                return self._call_openai(messages)
            if self.cfg.provider == "groq":
                return self._call_groq(messages)
            raise ProviderError("Unsupported provider")
        except Exception as e:  # map 429/5xx into ProviderError for retry
            _LAST_ERROR = str(e)
            # After repeated failures tenacity will re-raise; mark disabled to avoid cascades in batch
            _LLM_DISABLED = True
            raise ProviderError(str(e))

    def _validate_or_repair(self, data_str: str) -> Dict[str, Any]:
        # First parse attempt
        try:
            data = json.loads(data_str)
            validate(instance=data, schema=SCORING_JSON_SCHEMA)
            return data
        except Exception as e:
            original_err = e

        # One-shot repair pass
        repair_messages = [
            {"role": "system", "content": "Return STRICT JSON matching the provided schema, no prose."},
            {
                "role": "user",
                "content": (
                    "Repair this JSON to match the schema without changing meaning.\n"
                    "Schema:\n" + json.dumps(SCORING_JSON_SCHEMA) + "\n"
                    "JSON:\n" + data_str
                ),
            },
        ]
        try:
            repaired = self._invoke(repair_messages)
            data = json.loads(repaired)
            validate(instance=data, schema=SCORING_JSON_SCHEMA)
            return data
        except Exception as e:
            raise ValidationFailed(f"Validation failed after repair: {_mask_pii(str(e))}; original: {_mask_pii(str(original_err))}")

    def score(self, resume: Dict[str, Any], job: Dict[str, Any], weights: Dict[str, float], context_chunks: list[Dict[str, Any]] | None = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        # Include more candidate-specific data in cache key to avoid identical scores
        resume_skills = resume.get("skills", [])[:5]  # First 5 skills for uniqueness
        resume_experience = resume.get("experience", [])
        exp_titles = [exp.get("title", "") for exp in resume_experience[:2]] if isinstance(resume_experience, list) else []

        payload = {
            "provider": self.cfg.provider,
            "model": self.cfg.model,
            "resume": {
                "name": resume.get("name", ""),
                "skills_sample": resume_skills,  # Include skills for uniqueness
                "exp_titles": exp_titles  # Include experience titles
            },
            "job": {"title": job.get("title", "")},
            "weights": weights,
            "chunks_hash": len(context_chunks or []),  # keep cache key simple; avoid PII
        }
        key = _cache_key(payload)
        start = time.time()

        if key in _cache:
            result = _cache[key]
            obs = self._obs(start, cache_hit=True)

            from app.core.json_logging import log_ai_scoring
            log_ai_scoring(
                event="cache_hit",
                provider=obs["provider"],
                model=obs["model"],
                processing_time_ms=obs["duration_ms"],
                cache_hit=True
            )
            return result, obs

        messages = build_messages(resume, job, weights, context_chunks=context_chunks)

        # Optional logging of prompts
        try:
            from app.core.config import settings
            if getattr(settings, "LOG_SCORING_PROMPTS", False):
                try:
                    trunc = int(getattr(settings, "LOG_SCORING_TRUNCATE_CHARS", 2000) or 2000)
                except Exception:
                    trunc = 2000
                # Mask PII in log output
                safe_messages = []
                for m in messages:
                    c = m.get("content", "")
                    if isinstance(c, str):
                        c = _mask_pii(c)
                    safe_messages.append({"role": m.get("role"), "content": (c[:trunc] if isinstance(c, str) else c)})

                logger.info("AI scoring prompt generated",
                           event_type="ai_scoring",
                           event="prompt_generated",
                           provider=self.cfg.provider,
                           model=self.cfg.model,
                           message_count=len(safe_messages),
                           total_chars=sum(len(str(m.get("content", ""))) for m in safe_messages))
                _write_scoring_log("PROMPT", {"provider": self.cfg.provider, "model": self.cfg.model, "messages": safe_messages})
        except Exception:
            pass

        raw = self._invoke(messages)

        # Optional logging of raw responses
        try:
            from app.core.config import settings
            if getattr(settings, "LOG_SCORING_RESPONSES", False):
                try:
                    trunc = int(getattr(settings, "LOG_SCORING_TRUNCATE_CHARS", 2000) or 2000)
                except Exception:
                    trunc = 2000
                masked = _mask_pii((raw or "")[:trunc])

                logger.info("AI scoring response received",
                           event_type="ai_scoring",
                           event="response_received",
                           provider=self.cfg.provider,
                           model=self.cfg.model,
                           response_length=len(raw) if raw else 0,
                           response_preview=masked)
                _write_scoring_log("RESPONSE", {"provider": self.cfg.provider, "model": self.cfg.model, "raw": masked})
        except Exception:
            pass

        data = self._validate_or_repair(raw)
        _cache[key] = data
        obs = self._obs(start, cache_hit=False)

        from app.core.json_logging import log_ai_scoring
        log_ai_scoring(
            event="scoring_completed",
            provider=obs["provider"],
            model=obs["model"],
            processing_time_ms=obs["duration_ms"],
            cache_hit=False,
            overall_score=data.get("overall_score"),
            breakdown=data.get("breakdown")
        )
        return data, obs

