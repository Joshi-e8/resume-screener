from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.scoring.schemas import SCORING_JSON_SCHEMA
from app.scoring.service import score_resume_against_job

router = APIRouter(prefix="/v1/scoring", tags=["Scoring"])


class ScoringRequest(BaseModel):
    parsed_resume: Dict[str, Any]
    job: Dict[str, Any]
    weights: Optional[Dict[str, float]] = Field(default=None)


@router.post("/resume-vs-job")
async def score_resume_endpoint(payload: ScoringRequest) -> Dict[str, Any]:
    if not bool(int(str(getattr(settings, "ENABLE_SCORING", 1)) or "1")):
        raise HTTPException(status_code=503, detail="Scoring disabled")

    try:
        result = score_resume_against_job(payload.parsed_resume, payload.job, payload.weights)
        # Final defensive validation against schema shape
        # Note: avoid importing jsonschema here to keep fast path; service already validates.
        # We trust service; simply return.
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:  # noqa: BLE001
        # Map provider/network errors broadly as 502; keep message minimal
        msg = str(e)
        if any(code in msg for code in ["429", "502", "503", "504", "ProviderError"]):
            raise HTTPException(status_code=502, detail="Upstream provider error")
        raise HTTPException(status_code=500, detail="Internal error")

