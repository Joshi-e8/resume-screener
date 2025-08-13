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


def _offline_fallback_score(norm_resume: Dict[str, Any], norm_job: Dict[str, Any], weights: Dict[str, float]) -> Dict[str, Any]:
    # Very lightweight, deterministic fallback scoring when LLM is unavailable
    r_skills = set([s.lower() for s in norm_resume.get("skills", []) if isinstance(s, str)])
    j_skills = set([s.lower() for s in norm_job.get("required_skills", []) if isinstance(s, str)])
    overlap = r_skills & j_skills
    skills_match = 0.0
    if j_skills:
        skills_match = round(100.0 * len(overlap) / max(1, len(j_skills)), 2)

    # Experience relevance (years within a rough target)
    r_years = float(norm_resume.get("total_experience_years") or 0.0)
    j_min = float(norm_job.get("min_experience_years") or 0.0)
    j_max = float(norm_job.get("max_experience_years") or max(j_min, r_years))
    if j_max < j_min:
        j_max = j_min
    if r_years < j_min:
        exp_rel = max(0.0, 100.0 - (j_min - r_years) * 15.0)
    elif r_years > j_max:
        exp_rel = max(0.0, 100.0 - (r_years - j_max) * 10.0)
    else:
        exp_rel = 100.0

    # Seniority heuristic (keyword match)
    def _seniority_level(title: str) -> int:
        t = (title or "").lower()
        if any(k in t for k in ["lead", "principal", "staff"]):
            return 3
        if "senior" in t:
            return 2
        if any(k in t for k in ["junior", "intern", "trainee"]):
            return 0
        return 1

    r_title = (norm_resume.get("title") or "")
    j_title = (norm_job.get("title") or "")
    seniority_gap = abs(_seniority_level(r_title) - _seniority_level(j_title))
    seniority_alignment = max(0.0, 100.0 - seniority_gap * 25.0)

    # Education fit (presence of degree keywords)
    edu = " ".join(norm_resume.get("education", []))[:300].lower()
    edu_fit = 100.0 if any(k in edu for k in ["bachelor", "master", "phd", "degree"]) else 50.0

    breakdown = {
        "skills_match": skills_match,
        "experience_relevance": round(exp_rel, 2),
        "seniority_alignment": round(seniority_alignment, 2),
        "education_fit": edu_fit,
        "domain_expertise": 50.0,
        "certifications": 50.0,
    }

    # Weighted sum
    overall = 0.0
    for k, w in weights.items():
        overall += breakdown.get(k, 0.0) * w
    overall = round(_clamp(overall, 0.0, 100.0), 2)

    return {
        "overall_score": overall,
        "breakdown": breakdown,
        "derived": {"computed_weights": weights, "server_check_overall": overall, "fallback": True},
    }


def score_resume_against_job(parsed_resume: Dict[str, Any], job: Dict[str, Any], weights: Dict[str, float] | None = None) -> Dict[str, Any]:
    # 1) Normalize inputs
    norm_resume = normalize_resume(parsed_resume)
    norm_job = normalize_job(job)

    # 2) Normalize weights
    computed_weights = _normalize_weights(weights)

    # 3) Retrieve vector context and call LLM client with fallback
    # context retrieval is optional/soft-fail
    context_chunks = []
    try:
        from app.vector.store import search_resume_chunks, get_mode
        # When called from Celery, parsed_resume may have file_id or resume_id; try both
        key = parsed_resume.get("resume_id") or parsed_resume.get("file_id") or parsed_resume.get("id")
        job_query_parts = [norm_job.get("title") or "", ", ".join(norm_job.get("required_skills") or [])]
        jd_desc = norm_job.get("description") or ""
        if jd_desc:
            job_query_parts.append(jd_desc[:1000])
        query = " | ".join([p for p in job_query_parts if p])
        if key and query:
            context_chunks = search_resume_chunks(str(key), query, top_k=6)
            from loguru import logger as _lg
            _lg.info(f"[vector] Retrieved {len(context_chunks)} chunks for resume_key={key} (mode={get_mode()})")
    except Exception as vex:
        from loguru import logger as _lg
        _lg.warning(f"[vector] Retrieval failed: {vex}")
        context_chunks = []

    client = LLMClient()
    try:
        result, obs = client.score(norm_resume, norm_job, computed_weights, context_chunks=context_chunks)
    except Exception as e:
        from loguru import logger
        logger.warning(f"[scoring] LLM failed: {str(e)}; using offline fallback scorer")
        result = _offline_fallback_score(norm_resume, norm_job, computed_weights)

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

