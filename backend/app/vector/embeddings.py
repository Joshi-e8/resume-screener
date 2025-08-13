from __future__ import annotations

from typing import List
from loguru import logger

try:
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

from app.scoring.llm_config import get_llm_config


def embed_texts(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []
    cfg = get_llm_config()
    if cfg.provider != "openai" or OpenAI is None:
        logger.warning("Embeddings require OpenAI-compatible provider; skipping")
        return []
    try:
        client = OpenAI(api_key=cfg.api_key, base_url=cfg.base_url)
        # Prefer a dedicated embedding model if provided via OPENAI_MODEL; else fallback
        model = getattr(cfg, "embedding_model", None) or "text-embedding-3-small"
        resp = client.embeddings.create(model=model, input=texts)
        return [item.embedding for item in resp.data]
    except Exception as e:
        logger.warning(f"Embedding call failed: {e}")
        return []

