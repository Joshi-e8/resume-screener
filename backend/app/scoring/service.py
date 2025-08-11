from __future__ import annotations

from typing import Any, Dict

from app.scoring.adapter import normalize_job, normalize_resume
from app.scoring.llm_client import LLMClient

DEFAULT_WEIGHTS: Dict[str, float] = {
    "skills_match": 0.40,
    "experience_relevance": 0.30,
    "seniority_alignment": 0.10,
    "education_fit": 0.05,
    "domain_expertise": 0.10,
    "certifications": 0.05,
}


def _normalize_weights(weights: Dict[str, float] | None) -> Dict[str, float]:
    if not weights:
        return DEFAULT_WEIGHTS.copy()
    # Ensure only known keys and non-negative
    filtered = {k: float(max(0.0, weights.get(k, 0.0))) for k in DEFAULT_WEIGHTS.keys()}
    total = sum(filtered.values()) or 1.0
    return {k: round(v / total, 6) for k, v in filtered.items()}


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def score_resume_against_job(parsed_resume: Dict[str, Any], job: Dict[str, Any], weights: Dict[str, float] | None = None) -> Dict[str, Any]:
    # 1) Normalize inputs
    norm_resume = normalize_resume(parsed_resume)
    norm_job = normalize_job(job)

    # 2) Normalize weights
    computed_weights = _normalize_weights(weights)

    # 3) Call LLM client
    client = LLMClient()
    result, obs = client.score(norm_resume, norm_job, computed_weights)

    # 4) Compute server check overall
    breakdown = result.get("breakdown", {})
    overall = 0.0
    for k, w in computed_weights.items():
        overall += float(breakdown.get(k, 0.0)) * w
    server_check_overall = round(_clamp(overall, 0.0, 100.0), 2)

    # Attach derived fields
    if "derived" not in result or not isinstance(result["derived"], dict):
        result["derived"] = {}
    result["derived"]["computed_weights"] = computed_weights
    result["derived"]["server_check_overall"] = server_check_overall

    return result

