"""
JSON schema and helpers for parsed resume validation.
"""
from __future__ import annotations

from typing import Any, Dict

PARSED_RESUME_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "file": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "name": {"type": "string"},
                "ext": {"type": "string"},
                "size": {"type": "number"},
                "pages": {"type": "number"},
            },
            "required": ["name", "ext", "size", "pages"],
        },
        "candidate": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "name": {"type": "string"},
                "emails": {"type": "array", "items": {"type": "string"}},
                "phones": {"type": "array", "items": {"type": "string"}},
                "links": {"type": "object"},
                "location": {"type": "object"},
            },
            "required": ["emails", "phones", "links", "location"],
        },
        "summary": {"type": "string"},
        "skills": {
            "type": "array",
            "items": {"type": "object", "properties": {"name": {"type": "string"}, "category": {"type": ["string", "null"]}}, "required": ["name"]},
        },
        "languages": {
            "type": "array",
            "items": {"type": "object", "properties": {"name": {"type": "string"}, "proficiency": {"type": ["string", "null"]}}, "required": ["name"]},
        },
        "experience": {"type": "array"},
        "education": {"type": "array"},
        "certifications": {"type": "array"},
        "projects": {"type": "array"},
        "awards": {"type": "array"},
        "publications": {"type": "array"},
        "total_experience_years": {"type": "number"},
        "provenance": {"type": "object"},
        "warnings": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "file",
        "candidate",
        "summary",
        "skills",
        "languages",
        "experience",
        "education",
        "certifications",
        "projects",
        "awards",
        "publications",
        "total_experience_years",
        "provenance",
        "warnings",
    ],
}


def validate_parsed_resume(obj: Dict[str, Any]) -> tuple[bool, list[str]]:
    """Validate parsed resume; return (ok, warnings). Avoid raising; return error messages as warnings."""
    try:
        from jsonschema import Draft7Validator
    except Exception:
        # If jsonschema unavailable, skip strict validation
        return True, ["jsonschema not available; skipped validation"]

    validator = Draft7Validator(PARSED_RESUME_SCHEMA)
    errors = sorted(validator.iter_errors(obj), key=lambda e: e.path)
    warns: list[str] = []
    for e in errors:
        try:
            loc = "/".join([str(p) for p in e.path])
            warns.append(f"schema:{loc}:{e.message}")
        except Exception:
            warns.append(f"schema:{e.message}")
    return (len(warns) == 0), warns

