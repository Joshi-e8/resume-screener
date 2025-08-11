from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class ScoringSettings(BaseSettings):
    """Scoring-specific settings (kept separate to avoid touching existing config)."""

    # Feature flag
    ENABLE_SCORING: bool = Field(default=True)

    # Provider selection
    PROVIDER: str = Field(default="openai")  # "openai" | "groq"

    # OpenAI-compatible gateway
    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str | None = None  # default handled downstream
    OPENAI_MODEL: str = Field(default="gpt-4")

    # Groq
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = Field(default="llama-3.1-70b-versatile")

    # Generation controls
    SCORING_TEMPERATURE: float = Field(default=0.2)
    SCORING_MAX_TOKENS: int = Field(default=1200)

    # Caching
    CACHE_TTL_SECONDS: int = Field(default=300)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_scoring_settings() -> ScoringSettings:
    return ScoringSettings()
