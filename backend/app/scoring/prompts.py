from __future__ import annotations

import json
from typing import Any, Dict, List

SYSTEM_PROMPT = (
    "You are a technical recruiter & hiring manager assistant. Score a single candidate resume "
    "against a single job requisition. Return STRICT JSON ONLY that conforms to the given JSON Schema. "
    "Use 0–100 scales. Compute overall_score as weighted average of the breakdown metrics. Be fair and balanced, "
    "recognize equivalent technologies and transferable skills. Do not include prose or markdown—JSON ONLY. "
    "Consider that technologies within the same category often serve similar purposes and have transferable concepts. "
    "Evaluate the candidate's experience level and growth potential. Avoid giving 0 scores unless truly unqualified. "
    "IMPORTANT: Calculate total_experience_years in the derived section by analyzing the candidate's work experience timeline. "
    "Find the earliest start date and latest end date (or present) across all positions to determine the total career span in years. "
    "For overlapping positions, use the overall career span, not the sum of individual position durations. "
    "HIRING RECOMMENDATIONS: Be constructive and realistic in your assessments: "
    "- hiring_recommendation: 'STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE', or 'STRONG_NO_HIRE' "
    "- recommendation_reason: 2-3 sentence explanation focusing on overall fit and potential "
    "- key_strengths: 3-5 specific strengths that make this candidate valuable "
    "- potential_concerns: 2-4 areas of concern or improvement needed (can be empty array if none) "
    "Be fair - if someone has relevant experience and skills, don't give NO_HIRE unless they're truly unqualified."
)


def _pp(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def build_messages(resume: Dict[str, Any], job: Dict[str, Any], weights: Dict[str, float], context_chunks: List[Dict[str, Any]] | None = None) -> List[Dict[str, str]]:
    rules = {
        "rules": [
            "Use only the provided context_chunks (if any) and resume fields; do not invent details.",
            "Count only complete skills/technologies; ignore fragmented tokens or OCR artifacts.",
            "Prioritize mapping to job.must_have_skills; nice_to_have should help but not heavily penalize if missing.",
            "Skill mapping: exact, synonyms, adjacent stacks (e.g., Flask~Django~FastAPI, PostgreSQL~SQL).",
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
    payload_context = []
    if context_chunks:
        # Keep only minimal fields and limit total chars to reduce tokens
        total = 0
        for ch in context_chunks[:8]:
            txt = (ch.get("text") or "")
            if not txt:
                continue
            payload_context.append({
                "section": ch.get("section"),
                "chunk_index": ch.get("chunk_index"),
                "text": txt[:1500],
            })
            total += len(txt)
            if len(payload_context) >= 8:
                break
    user_payload = {
        "job": job,
        "resume": resume,
        "weights": weights,
        "context_chunks": payload_context,
        **rules,
    }
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _pp(user_payload)},
    ]

