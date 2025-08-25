from __future__ import annotations

from typing import Final, Dict, Any

# Authoritative JSON Schema for scoring outputs
SCORING_JSON_SCHEMA: Final[Dict[str, Any]] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "overall_score": {"type": "number", "minimum": 0, "maximum": 100},
        "breakdown": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "skills_match": {"type": "number", "minimum": 0, "maximum": 100},
                "experience_relevance": {"type": "number", "minimum": 0, "maximum": 100},
                "seniority_alignment": {"type": "number", "minimum": 0, "maximum": 100},
                "education_fit": {"type": "number", "minimum": 0, "maximum": 100},
                "domain_expertise": {"type": "number", "minimum": 0, "maximum": 100},
                "certifications": {"type": "number", "minimum": 0, "maximum": 100},
            },
            "required": [
                "skills_match",
                "experience_relevance",
                "seniority_alignment",
                "education_fit",
                "domain_expertise",
                "certifications",
            ],
        },
        "explanations": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "top_matches": {"type": "array", "items": {"type": "string"}},
                "gaps": {"type": "array", "items": {"type": "string"}},
                "risk_flags": {"type": "array", "items": {"type": "string"}},
                "suggested_improvements": {"type": "array", "items": {"type": "string"}},
            },
            "required": [
                "top_matches",
                "gaps",
                "risk_flags",
                "suggested_improvements",
            ],
        },
        "derived": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "computed_weights": {
                    "type": "object",
                    "additionalProperties": {"type": "number"},
                },
                "server_check_overall": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 100,
                },
                "total_experience_years": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 50,
                },
            },
            "required": ["computed_weights", "server_check_overall", "total_experience_years"],
        },
    },
    "required": ["overall_score", "breakdown", "explanations", "derived"],
}

# For OpenAI response_format usage
OPENAI_RESPONSE_FORMAT: Final[Dict[str, Any]] = {
    "type": "json_schema",
    "json_schema": {
        "name": "ResumeScore",
        "schema": SCORING_JSON_SCHEMA,
        "strict": True,
    },
}

