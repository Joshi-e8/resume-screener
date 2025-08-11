from __future__ import annotations

import hashlib
import json
import time
from typing import Any, Dict, Tuple

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
        try:
            if self.client is None:
                raise ProviderError("No client for provider")
            if self.cfg.provider == "openai":
                return self._call_openai(messages)
            if self.cfg.provider == "groq":
                return self._call_groq(messages)
            raise ProviderError("Unsupported provider")
        except Exception as e:  # map 429/5xx into ProviderError for retry
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

    def score(self, resume: Dict[str, Any], job: Dict[str, Any], weights: Dict[str, float]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        payload = {
            "provider": self.cfg.provider,
            "model": self.cfg.model,
            "resume": {"name": resume.get("name", "")},  # PII-safe subset for cache key hashing
            "job": {"title": job.get("title", "")},
            "weights": weights,
        }
        key = _cache_key(payload)
        start = time.time()

        if key in _cache:
            result = _cache[key]
            obs = self._obs(start, cache_hit=True)
            logger.info("[scoring] cache_hit=true provider={} model={} duration_ms={}", obs["provider"], obs["model"], obs["duration_ms"])  # no PII
            return result, obs

        messages = build_messages(resume, job, weights)
        raw = self._invoke(messages)
        data = self._validate_or_repair(raw)
        _cache[key] = data
        obs = self._obs(start, cache_hit=False)
        logger.info("[scoring] cache_hit=false provider={} model={} duration_ms={}", obs["provider"], obs["model"], obs["duration_ms"])  # no PII
        return data, obs

