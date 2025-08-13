from __future__ import annotations

from fastapi import APIRouter
from app.scoring.llm_config import get_llm_config
from loguru import logger

router = APIRouter(prefix="/v1/health", tags=["Health"]) 

@router.get("/llm")
async def llm_health():
    """Return current LLM provider configuration (sanitized) and readiness hint."""
    try:
        cfg = get_llm_config()
        key_present = False
        try:
            from app.core.config import settings
            key_present = bool(getattr(settings, "OPENAI_API_KEY", None) or getattr(settings, "GROQ_API_KEY", None))
        except Exception:
            pass
        return {
            "provider": cfg.provider,
            "base_url": cfg.base_url,
            "model": cfg.model,
            "temperature": cfg.temperature,
            "max_tokens": cfg.max_tokens,
            "api_key_present": key_present,
        }
    except Exception as e:
        logger.warning(f"llm_health failed: {e}")
        return {"error": str(e)}

