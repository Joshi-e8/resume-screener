from __future__ import annotations

from typing import List
from loguru import logger

try:
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

from app.scoring.llm_config import get_llm_config


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embeddings disabled - using Groq provider which doesn't support embeddings"""
    if not texts:
        return []

    # Always return empty list to disable embeddings completely
    logger.info("Embeddings disabled - using text-only search with Groq provider")
    return []

