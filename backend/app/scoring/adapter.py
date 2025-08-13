from __future__ import annotations

from typing import Any, Dict, List
import re
from datetime import datetime

# Very lightweight tech dictionary to augment parsed skills (no external deps)
TECH_TERMS = {
    # languages
    "python", "java", "javascript", "typescript", "go", "ruby", "c#", "c++", "sql",
    # frameworks
    "django", "flask", "fastapi", "spring", "react", "react.js", "next.js", "node.js", "express",
    # data/tools
    "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes", "git", "aws", "gcp", "azure",
    # misc
    "pandas", "numpy", "tailwind css", "stripe", "graphql", "rest api", "ci/cd", "github actions",
}

LOCATION_WORDS = {"kerala", "india", "calicut", "kochi", "wayanad", "bangalore", "mumbai", "delhi"}
GENERIC_NON_SKILLS = {
    "experience", "applications", "tools", "concepts", "frontend", "backend",
    "languages", "frameworks", "databases", "projects", "summary",
    "skills languages frameworks python", "next.js databases", "postgresql frontend tools zustand",
}


def _clean_skill_tokens(skills: list[str], raw_text: str | None = None) -> list[str]:
    out: list[str] = []
    rt = (raw_text or "").lower()
    for s in skills or []:
        if not isinstance(s, str):
            continue
        t = s.strip()
        if not t:
            continue
        tl = t.lower()
        # drop obvious location phrases if not part of a tech
        if any(w in tl for w in LOCATION_WORDS):
            # skip tokens that are essentially location-only
            letters = sum(ch.isalpha() for ch in tl)
            if letters >= len(tl) - 2:
                continue
        if len(t) <= 3:
            continue
        # remove extremely short sub tokens unless part of common tech patterns
        if any(len(tok) <= 2 for tok in t.split()):
            if tl not in {"ci", "cd"} and not any(c in t for c in [".", "-", "/"]):
                continue
        if tl in GENERIC_NON_SKILLS:
            continue
        out.append(t)
    # dedupe preserving order and cap
    return list(dict.fromkeys(out))[:60]


def _augment_skills_from_raw(raw_text: str, existing: list[str]) -> list[str]:
    if not raw_text:
        return existing
    found: list[str] = []
    low = raw_text.lower()
    for term in TECH_TERMS:
        if term in low:
            found.append(term.title() if term.islower() else term)
    merged = list(dict.fromkeys((existing or []) + found))
    return merged


def _parse_years_from_text(text: str) -> float:
    """Parse simple date ranges like 'MM/YYYY - MM/YYYY' or 'YYYY - Present' and return years."""
    if not text or not isinstance(text, str):
        return 0.0
    t = text
    # Patterns
    patterns = [
        r"(?P<m1>\d{1,2})\/(?P<y1>\d{4})\s*-\s*(?P<m2>\d{1,2})\/(?P<y2>\d{4})",
        r"(?P<y1>\d{4})\s*-\s*(?P<y2>\d{4})",
        r"(?P<m1>\d{1,2})\/(?P<y1>\d{4})\s*-\s*(present|current)",
        r"(?P<y1>\d{4})\s*-\s*(present|current)",
    ]
    now = datetime.now()
    for p in patterns:
        m = re.search(p, t, re.IGNORECASE)
        if not m:
            continue
        gd = m.groupdict()
        try:
            if "y2" in gd and gd.get("y2"):
                y1 = int(gd.get("y1"))
                y2 = int(gd.get("y2"))
                m1 = int(gd.get("m1")) if gd.get("m1") else 1
                m2 = int(gd.get("m2")) if gd.get("m2") else 1
                months = (y2 - y1) * 12 + (m2 - m1)
                return max(0.0, round(months / 12.0, 2))
            else:
                # present/current range
                y1 = int(gd.get("y1"))
                m1 = int(gd.get("m1")) if gd.get("m1") else 1
                months = (now.year - y1) * 12 + (now.month - m1)
                return max(0.0, round(months / 12.0, 2))
        except Exception:
            continue
    return 0.0


def _strip_location_and_dates(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    t = text
    # remove date ranges
    t = re.sub(r"\d{1,2}\/\d{4}\s*-\s*(\d{1,2}\/\d{4}|present|current)", "", t, flags=re.IGNORECASE)
    t = re.sub(r"\d{4}\s*-\s*(\d{4}|present|current)", "", t, flags=re.IGNORECASE)
    # remove common locations
    for w in LOCATION_WORDS:
        t = re.sub(rf"\b{re.escape(w)}\b", "", t, flags=re.IGNORECASE)
    # collapse whitespace and punctuation leftovers
    t = re.sub(r"\s{2,}", " ", t).strip(" ,.-")
    return t.strip()



def _get(obj: Dict[str, Any], keys: List[str], default=None):
    for k in keys:
        if isinstance(obj, dict) and k in obj and obj[k] is not None:
            return obj[k]
    return default


def normalize_resume(parsed: Dict[str, Any]) -> Dict[str, Any]:
    # Name
    name = _get(parsed, ["name", "full_name", "candidate_name"], "")

    # Skills: clean, remove locations/generic, augment from raw_text
    skills = _get(parsed, ["skills", "technical_skills", "skillset"], []) or []
    if isinstance(skills, dict):
        skills = list(skills.values())
    if isinstance(skills, str):
        skills = [skills]
    raw_text = parsed.get("raw_text") or ""
    skills = _clean_skill_tokens(skills, raw_text)
    skills = _augment_skills_from_raw(raw_text, skills)

    # Experience: try to compute years if parser missed
    exp_src = _get(parsed, ["experience", "work_experience", "jobs"], []) or []
    experience: List[Dict[str, Any]] = []
    total_years_accum = 0.0
    for e in exp_src if isinstance(exp_src, list) else []:
        title_raw = _get(e, ["title", "designation", "role"], "")
        title = _strip_location_and_dates(title_raw)
        years = _get(e, ["years", "duration_years"], 0) or 0
        if not years:
            years = _parse_years_from_text(_get(e, ["duration"], "") or title_raw)
        domain = _get(e, ["domain", "industry"], None)
        tech = _get(e, ["tech", "technologies", "tools", "stack"], []) or []
        if isinstance(tech, str):
            tech = [tech]
        try:
            years_f = float(years) if isinstance(years, (int, float)) else float(years)
        except Exception:
            years_f = 0.0
        total_years_accum += max(0.0, years_f)
        experience.append(
            {
                "title": title,
                "years": round(max(0.0, years_f), 2),
                "domain": domain,
                "tech": _clean_skill_tokens(tech, raw_text),
                "from": _get(e, ["from", "start", "start_date"], None),
                "to": _get(e, ["to", "end", "end_date"], None),
            }
        )

    # Education
    edu_src = _get(parsed, ["education", "academics"], []) or []
    education: List[Dict[str, Any]] = []
    for ed in edu_src if isinstance(edu_src, list) else []:
        education.append(
            {
                "degree": _get(ed, ["degree", "qualification"], ""),
                "institution": _get(ed, ["institution", "school", "college", "university"], None),
                "year": _get(ed, ["year", "graduation_year", "passed"], None),
            }
        )

    # Certifications
    certs = _get(parsed, ["certifications", "certs"], []) or []
    if isinstance(certs, str):
        certs = [certs]

    # Total years: prefer parsed value, else sum of entries (cap at reasonable upper bound)
    try:
        total_years = float(parsed.get("total_experience_years") or 0.0)
    except Exception:
        total_years = 0.0
    if total_years <= 0.0 and total_years_accum > 0.0:
        total_years = round(min(total_years_accum, 50.0), 2)

    # Title: prefer explicit title; else try to infer from the first experience
    title = parsed.get("title") or parsed.get("current_role") or (experience[0]["title"] if experience else "")

    return {
        "name": name,
        "skills": skills if isinstance(skills, list) else [],
        "experience": experience,
        "education": education,
        "certifications": certs if isinstance(certs, list) else [],
        "total_experience_years": total_years,
        "title": title,
    }


def normalize_job(job: Dict[str, Any]) -> Dict[str, Any]:
    title = _get(job, ["title", "role", "position"], "")

    must_have = _get(job, ["must_have_skills", "must_have", "required_skills"], []) or []
    if isinstance(must_have, str):
        must_have = [must_have]

    nice = _get(job, ["nice_to_have", "nice_to_have_skills", "preferred_skills"], []) or []
    if isinstance(nice, str):
        nice = [nice]

    min_years = _get(job, ["min_years", "min_experience", "minimum_years"], 0) or 0
    domain = _get(job, ["domain", "industry"], None)

    edu_req = _get(job, ["education_requirements", "education"], []) or []
    if isinstance(edu_req, str):
        edu_req = [edu_req]

    cert_pref = _get(job, ["certifications_pref", "certifications", "preferred_certifications"], []) or []
    if isinstance(cert_pref, str):
        cert_pref = [cert_pref]

    return {
        "title": title,
        "must_have_skills": must_have if isinstance(must_have, list) else [],
        "nice_to_have": nice if isinstance(nice, list) else [],
        "min_years": float(min_years) if isinstance(min_years, (int, float)) else 0.0,
        "domain": domain if isinstance(domain, (str, type(None))) else None,
        "education_requirements": edu_req if isinstance(edu_req, list) else [],
        "certifications_pref": cert_pref if isinstance(cert_pref, list) else [],
    }

