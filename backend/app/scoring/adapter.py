from __future__ import annotations

from typing import Any, Dict, List


def _get(obj: Dict[str, Any], keys: List[str], default=None):
    for k in keys:
        if isinstance(obj, dict) and k in obj and obj[k] is not None:
            return obj[k]
    return default


def normalize_resume(parsed: Dict[str, Any]) -> Dict[str, Any]:
    # Name
    name = _get(parsed, ["name", "full_name", "candidate_name"], "")

    # Skills
    skills = _get(parsed, ["skills", "technical_skills", "skillset"], []) or []
    if isinstance(skills, dict):
        skills = list(skills.values())
    if isinstance(skills, str):
        skills = [skills]

    # Experience
    exp_src = _get(parsed, ["experience", "work_experience", "jobs"], []) or []
    experience: List[Dict[str, Any]] = []
    for e in exp_src if isinstance(exp_src, list) else []:
        title = _get(e, ["title", "designation", "role"], "")
        years = _get(e, ["years", "duration_years", "duration"], 0) or 0
        domain = _get(e, ["domain", "industry"], None)
        tech = _get(e, ["tech", "technologies", "tools", "stack"], []) or []
        if isinstance(tech, str):
            tech = [tech]
        experience.append(
            {
                "title": title,
                "years": float(years) if isinstance(years, (int, float)) else 0.0,
                "domain": domain,
                "tech": tech if isinstance(tech, list) else [],
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

    return {
        "name": name,
        "skills": skills if isinstance(skills, list) else [],
        "experience": experience,
        "education": education,
        "certifications": certs if isinstance(certs, list) else [],
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

