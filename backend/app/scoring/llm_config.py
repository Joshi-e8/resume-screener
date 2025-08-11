from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.core.config import settings


@dataclass(frozen=True)
class LLMConfig:
    provider: str
    api_key: Optional[str]
    base_url: Optional[str]
    model: str
    temperature: float
    max_tokens: int


def get_llm_config() -> LLMConfig:
    provider = (getattr(settings, "PROVIDER", None) or "openai").lower()

    # Defaults aligned with requirement
    temperature = float(getattr(settings, "SCORING_TEMPERATURE", 0.2) or 0.2)
    max_tokens = int(getattr(settings, "SCORING_MAX_TOKENS", 1200) or 1200)

    if provider == "openai":
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        base_url = getattr(settings, "OPENAI_BASE_URL", None) or "https://api.openai.com/v1"
        model = getattr(settings, "OPENAI_MODEL", None) or "gpt-4"
        return LLMConfig(
            provider="openai",
            api_key=api_key,
            base_url=base_url,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    if provider == "groq":
        api_key = getattr(settings, "GROQ_API_KEY", None)
        base_url = None
        model = getattr(settings, "GROQ_MODEL", None) or "llama-3.1-70b-versatile"
        return LLMConfig(
            provider="groq",
            api_key=api_key,
            base_url=base_url,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    # Fallback to openai if unknown provider
    api_key = getattr(settings, "OPENAI_API_KEY", None)
    base_url = getattr(settings, "OPENAI_BASE_URL", None) or "https://api.openai.com/v1"
    model = getattr(settings, "OPENAI_MODEL", None) or "gpt-4"
    return LLMConfig(
        provider="openai",
        api_key=api_key,
        base_url=base_url,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )

