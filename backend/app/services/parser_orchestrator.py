"""
Config-driven parser orchestrator: detects document type, selects extractors, optional page-selective OCR,
performs section-aware extraction, skills canonicalization via runtime-loaded gazetteers, and emits validated JSON.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from loguru import logger
import time
import re

from .parser_config import get_parser_config_provider
from .parser_utils import parse_date_range, compute_overlap_safe_years, is_probable_location
from .parser_schema import validate_parsed_resume


@dataclass
class OrchestratorConfig:
    enable_ocr: bool
    enable_ner: bool
    max_ocr_pages: int
    low_text_threshold: float
    min_skill_conf: float


def _get_settings_safe() -> OrchestratorConfig:
    try:
        from app.core.config import settings
        return OrchestratorConfig(
            enable_ocr=bool(int(str(getattr(settings, "PARSER_ENABLE_OCR", 0) or "0"))),
            enable_ner=bool(int(str(getattr(settings, "PARSER_ENABLE_NER", 0) or "0"))),
            max_ocr_pages=int(getattr(settings, "PARSER_MAX_OCR_PAGES", 2) or 2),
            low_text_threshold=float(getattr(settings, "PARSER_LOW_TEXT_THRESHOLD", 0.02) or 0.02),
            min_skill_conf=float(getattr(settings, "PARSER_MIN_SKILL_CONF", 0.6) or 0.6),
        )
    except Exception:
        return OrchestratorConfig(False, False, 2, 0.02, 0.6)


class DocumentTypeDetector:
    def detect(self, file_path: str) -> Dict[str, Any]:
        # Only light inspection to avoid I/O costs; rely on extension and parsers for details
        import os
        ext = os.path.splitext(file_path)[1].lower()
        return {"ext": ext, "encrypted": False, "pages": None}


class DigitalExtractors:
    async def extract_pdf(self, file_path: str) -> Dict[str, Any]:
        # Reuse existing extraction for PDFs from ResumeParser
        from app.services.resume_parser import ResumeParser
        rp = ResumeParser()
        text = await rp._extract_pdf_text(file_path)  # type: ignore[attr-defined]
        return {"text": text, "backend": "pdfplumber+pypdf2"}

    async def extract_doc(self, file_path: str) -> Dict[str, Any]:
        from app.services.resume_parser import ResumeParser
        rp = ResumeParser()
        text = await rp._extract_docx_text(file_path)  # type: ignore[attr-defined]
        return {"text": text, "backend": "python-docx"}

    async def extract_txt(self, file_path: str) -> Dict[str, Any]:
        from app.services.resume_parser import ResumeParser
        rp = ResumeParser()
        text = await rp._extract_txt_text(file_path)  # type: ignore[attr-defined]
        return {"text": text, "backend": "plain"}


class ParserOrchestrator:
    def __init__(self) -> None:
        self.cfg = _get_settings_safe()
        self.detector = DocumentTypeDetector()
        self.extractors = DigitalExtractors()
        self.provider = get_parser_config_provider()

    async def parse(self, file_path: str, filename: Optional[str] = None, size: Optional[int] = None) -> Dict[str, Any]:
        t0 = time.time()
        meta = self.detector.detect(file_path)
        ext = meta.get("ext")
        backend = ""
        text = ""
        logger.info("[parser] start file={} ext={} size={}", filename or "", (ext or "").lstrip("."), int(size or 0))
        try:
            if ext == ".pdf":
                res = await self.extractors.extract_pdf(file_path)
                text, backend = res.get("text", ""), res.get("backend", "")
            elif ext in (".doc", ".docx"):
                res = await self.extractors.extract_doc(file_path)
                text, backend = res.get("text", ""), res.get("backend", "")
            elif ext == ".txt":
                res = await self.extractors.extract_txt(file_path)
                text, backend = res.get("text", ""), res.get("backend", "")
            else:
                logger.warning("[parser] unsupported_ext={} file={} ", ext, filename or "")
                return self._empty_result(filename, ext, size, warnings=[f"unsupported_ext:{ext}"])
        except Exception as e:
            logger.warning("[parser] extraction_failed backend={} err={}", backend, type(e).__name__)
            return self._empty_result(filename, ext, size, warnings=["extraction_failed"])

        if not text or not text.strip():
            logger.info("[parser] no_text_extracted backend={} file={} ", backend, filename or "")
            return self._empty_result(filename, ext, size, warnings=["no_text_extracted"])

        # Section segmentation (rule-based minimal viable; rules from provider)
        t1 = time.time()
        sections = self._segment_sections(text)
        logger.info("[parser] segmented sections in {}ms", int((time.time() - t1) * 1000))

        # Contacts: from CONTACT section or top of doc
        candidate = self._extract_contacts(sections, text)
        logger.info("[parser] contacts emails={} phones={} links={} ", len(candidate.get("emails") or []), len(candidate.get("phones") or []), len((candidate.get("links") or {})))

        # Experience/Education minimal extraction
        t2 = time.time()
        experience, total_years = self._extract_experience(sections)
        logger.info("[parser] experience jobs={} years={}", len(experience), total_years)
        # Map education lines to objects to satisfy schema
        education_lines = sections.get("education", []) or []
        education = []
        import re as _re
        for ln in education_lines:
            if not ln or len(ln) < 2:
                continue
            year = None
            m = _re.search(r"(19|20)\d{2}", ln)
            if m:
                try:
                    year = int(m.group(0))
                except Exception:
                    year = None
            education.append({"degree": "", "field": "", "institution": ln, "location": "", "year": year})

        # Skills miner: from skills section + highlights
        t3 = time.time()
        skills = self._mine_skills(sections)
        logger.info("[parser] skills mined={} ", len(skills))

        # Languages/Certs/Projects minimal passthrough (map languages to objects)
        lang_tokens: list[str] = []
        for ln in sections.get("languages", []) or []:
            for t in [t.strip() for t in _re.split(r"[,;|/•\-]", ln) if t.strip()]:
                if len(t) >= 2:
                    lang_tokens.append(t)
        seen_lang = set()
        languages = []
        for t in lang_tokens:
            key = t.lower()
            if key in seen_lang:
                continue
            seen_lang.add(key)
            languages.append({"name": t, "proficiency": None})
        certs = sections.get("certifications", [])
        projects = sections.get("projects", [])
        awards = sections.get("awards", [])
        publications = sections.get("publications", [])

        obj: Dict[str, Any] = {
            "file": {
                "name": filename or "",
                "ext": (ext or "").lstrip("."),
                "size": int(size or 0),
                "pages": meta.get("pages") or 0,
            },
            "candidate": candidate,
            "summary": sections.get("summary", ""),
            "skills": skills,
            "languages": languages,
            "experience": experience,
            "education": education,
            "certifications": certs,
            "projects": projects,
            "awards": awards,
            "publications": publications,
            "total_experience_years": total_years,
            "provenance": {"backends": [backend], "pipeline": ["detector", "extractor", "segmenter", "miners"], "blocks": True},
            "warnings": [],
        }

        ok, warns = validate_parsed_resume(obj)
        if not ok:
            logger.info("[parser] schema_warnings={} first={} ", len(warns), (warns[0] if warns else ""))
            obj["warnings"].extend(warns[:10])
        logger.info("[parser] done backend={} duration_ms={} file={} ", backend, int((time.time() - t0) * 1000), filename or "")
        return obj

    def _empty_result(self, name: Optional[str], ext: Optional[str], size: Optional[int], warnings: List[str]) -> Dict[str, Any]:
        return {
            "file": {"name": name or "", "ext": (ext or "").lstrip("."), "size": int(size or 0), "pages": 0},
            "candidate": {"name": "", "emails": [], "phones": [], "links": {}, "location": {}},
            "summary": "",
            "skills": [],
            "languages": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "projects": [],
            "awards": [],
            "publications": [],
            "total_experience_years": 0.0,
            "provenance": {"backends": [], "pipeline": [], "blocks": True},
            "warnings": warnings,
        }

    def _segment_sections(self, text: str) -> Dict[str, Any]:
        rules = self.provider.get_section_rules() or {}
        # Minimal: split by headings from rules; default fallbacks
        buckets: Dict[str, List[str]] = {
            "summary": [], "skills": [], "experience": [], "education": [], "certifications": [], "projects": [], "languages": [], "awards": [], "publications": [], "contact": []
        }
        lines = [l.strip() for l in text.splitlines()]
        current = None
        synonyms = {k.lower(): [s.lower() for s in v] for k, v in rules.items()} if rules else {}
        def match_heading(line: str) -> Optional[str]:
            l = line.lower().strip(": ")
            for key, syns in synonyms.items():
                if l == key or l in syns:
                    return key
            # simple heuristics
            if l in buckets:
                return l
            return None
        for ln in lines:
            head = match_heading(ln)
            if head:
                current = head
                continue
            if current:
                buckets[current].append(ln)
        # normalize simple fields
        buckets["summary"] = " ".join(buckets["summary"])[:1000]
        return {
            "summary": buckets["summary"],
            "skills": buckets["skills"],
            "experience": buckets["experience"],
            "education": buckets["education"],
            "certifications": buckets["certifications"],
            "projects": buckets["projects"],
            "languages": buckets["languages"],
            "awards": buckets["awards"],
            "publications": buckets["publications"],
            "contact": buckets["contact"],
        }

    def _extract_contacts(self, sections: Dict[str, Any], full_text: str) -> Dict[str, Any]:
        import re
        region = "\n".join((sections.get("contact") or [])[:20]) or "\n".join(full_text.splitlines()[:25])
        emails = list({m.group(0) for m in re.finditer(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", region)})[:3]
        phones = list({m.group(0) for m in re.finditer(r"(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}", region)})[:3]
        links = {}
        for pat, key in [(r"linkedin\.com/in/[\w-]+", "linkedin"), (r"github\.com/[\w.-]+", "github"), (r"https?://[^\s]+", "other")]:
            m = re.search(pat, region, flags=re.IGNORECASE)
            if m:
                links[key] = m.group(0)
        loc_line = None
        for ln in region.splitlines():
            if "," in ln and not any(tok in ln.lower() for tok in ["linkedin", "github", "email", "phone", "skills", "experience", "education"]):
                loc_line = ln.strip()
                break
        location = {}
        if loc_line:
            parts = [p.strip() for p in loc_line.split(",")]
            if parts:
                location = {"raw": loc_line, "city": parts[0] if parts else None}
        return {"name": "", "emails": emails, "phones": phones, "links": links, "location": location}

    def _extract_experience(self, sections: Dict[str, Any]) -> tuple[List[Dict[str, Any]], float]:
        exp_lines = sections.get("experience") or []
        jobs: List[Dict[str, Any]] = []
        ranges: List[tuple[tuple[int, int], tuple[int, int]]] = []
        cur: Dict[str, Any] = {}
        for ln in exp_lines:
            dr = parse_date_range(ln)
            if dr:
                # finalize previous
                if cur:
                    jobs.append(cur)
                    cur = {}
                start, end = dr
                if end is None:
                    from datetime import datetime
                    now = datetime.utcnow()
                    end = (now.year, now.month)
                ranges.append((start, end))
                cur = {"organization": "", "title": "", "location": "", "from": f"{start[0]:04d}-{start[1]:02d}", "to": f"{end[0]:04d}-{end[1]:02d}", "current": False, "duration_years": 0.0, "highlights": [], "tech_or_tools": [], "page_spans": []}
            else:
                # heuristics for title/org/location
                if not cur.get("title") and re.search(r"\b(manager|engineer|developer|analyst|specialist|director|lead|architect)\b", ln, flags=re.I):
                    cur["title"] = ln
                elif not cur.get("organization") and len(ln) > 3 and not any(ch.isdigit() for ch in ln):
                    cur["organization"] = ln
                elif not cur.get("location") and is_probable_location(ln):
                    cur["location"] = ln
                else:
                    cur.setdefault("highlights", []).append(ln)
        if cur:
            jobs.append(cur)
        years = compute_overlap_safe_years(ranges) if ranges else 0.0
        # Set per-job duration when possible
        for j in jobs:
            try:
                if j.get("from") and j.get("to"):
                    a = tuple(map(int, j["from"].split("-")))
                    b = tuple(map(int, j["to"].split("-")))
                    months = (b[0]-a[0])*12 + (b[1]-a[1])
                    j["duration_years"] = round(max(0, months)/12.0, 2)
            except Exception:
                pass
        return jobs, years

    def _mine_skills(self, sections: Dict[str, Any]) -> List[Dict[str, Any]]:
        provider = self.provider
        gaz = provider.get_skills_gazetteer()  # {canonical: {"aliases": [...], "category": str}}
        aliases = provider.get_aliases()  # {alias: canonical}
        # Candidate tokens from skills section and highlights only
        cand: List[str] = []
        for s in sections.get("skills", []):
            cand.extend([t.strip() for t in re.split(r"[,;|/•\-]", s) if t.strip()])
        for ln in sections.get("experience", []):
            if ln.startswith("•") or ln.startswith("-"):
                cand.extend([t.strip() for t in re.split(r"[,;|/•\-]", ln) if t.strip()])
        # Canonicalize
        out: List[Dict[str, Any]] = []
        seen = set()
        for tok in cand:
            t = re.sub(r"\s+", " ", tok).strip()
            if not t or len(t) < 2:
                continue
            # drop location/header-like tokens
            if is_probable_location(t) or t.lower() in {"skills", "experience", "education", "contact"}:
                continue
            key = t.lower()
            can = aliases.get(key) if isinstance(aliases, dict) else None
            if not can and isinstance(gaz, dict):
                # direct canonical match
                if key in gaz:
                    can = key
                else:
                    # alias lookup within gaz values
                    for c, meta in gaz.items():
                        als = [a.lower() for a in (meta.get("aliases") or [])]
                        if key in als:
                            can = c
                            break
            canonical = can or t
            cat = None
            if isinstance(gaz, dict) and canonical.lower() in gaz:
                cat = gaz[canonical.lower()].get("category")
            if canonical not in seen:
                seen.add(canonical)
                out.append({"name": canonical, "category": cat})
        return out[:50]

