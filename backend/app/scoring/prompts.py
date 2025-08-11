from __future__ import annotations

import json
from typing import Any, Dict, List

SYSTEM_PROMPT = (
    "You are a technical recruiter & hiring manager assistant. Score a single candidate resume "
    "against a single job requisition. Return STRICT JSON ONLY that conforms to the given JSON Schema. "
    "Use 0–100 scales. Compute overall_score as weighted average of the breakdown metrics. Be objective, "
    "penalize irrelevance and outdated skills, reward recency and depth. Do not include prose or markdown—JSON ONLY."
)


def _pp(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def build_messages(resume: Dict[str, Any], job: Dict[str, Any], weights: Dict[str, float]) -> List[Dict[str, str]]:
    rules = {
        "rules": [
            "Skill mapping: exact, synonyms, adjacent stacks (e.g., Flask~Django~FastAPI).",
            "Experience relevance: domain, responsibilities, scale, recency, impact.",
            "Seniority alignment: role level (IC/Lead), ownership scope, mentoring.",
            "Education fit: degree/equivalent, relevance to requirements.",
            "Domain expertise: industry and tool familiarity.",
            "Certifications: named or strict equivalents.",
            "Risk flags: large gaps, frequent short stints, irrelevant stack, missing core skill.",
            "Suggested improvements: concrete, actionable (courses, projects, tools).",
            "Output: STRICT JSON per schema, no extra text.",
        ]
    }
    user_payload = {
        "job": job,
        "resume": resume,
        "weights": weights,
        **rules,
    }
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _pp(user_payload)},
    ]

