from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, UploadFile, Form, HTTPException

from app.services.parser_orchestrator import ParserOrchestrator
from app.services.parser_config import get_parser_config_provider

router = APIRouter(prefix="/parser", tags=["Parser"])


@router.get("/health")
async def parser_health() -> Dict[str, Any]:
    prov = get_parser_config_provider()
    status = prov.get_status()
    # Do not include PII; only config/status
    from app.services.parser_orchestrator import _get_settings_safe
    cfg = _get_settings_safe()
    return {
        "features": {
            "enable_ocr": cfg.enable_ocr,
            "enable_ner": cfg.enable_ner,
            "max_ocr_pages": cfg.max_ocr_pages,
        },
        "config": status,
    }


@router.post("/parse-one")
async def parse_one(file: UploadFile = File(...), enable_ocr: bool | None = Form(None), enable_ner: bool | None = Form(None), domain_pack: str | None = Form(None)) -> Dict[str, Any]:
    try:
        content = await file.read()
        # write to temp file-like for orchestrator which expects path; reuse existing ResumeParser memory extract? keep simple: save to temp
        import tempfile, os
        suffix = "." + (file.filename.split(".")[-1] if "." in file.filename else "bin")
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            orch = ParserOrchestrator()
            result = await orch.parse(tmp_path, filename=file.filename, size=len(content))
            return result
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
    except HTTPException:
        raise
    except Exception as e:
        return {
            "file": {"name": file.filename, "ext": (file.filename.split(".")[-1] if "." in file.filename else ""), "size": 0, "pages": 0},
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
            "warnings": [f"parse_error:{type(e).__name__}"],
        }


class BatchItem(BaseException):
    ...


@router.post("/parse-batch")
async def parse_batch(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    orch = ParserOrchestrator()
    import tempfile, os
    for f in files:
        try:
            content = await f.read()
            suffix = "." + (f.filename.split(".")[-1] if "." in f.filename else "bin")
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            try:
                res = await orch.parse(tmp_path, filename=f.filename, size=len(content))
                results.append(res)
            finally:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass
        except Exception as e:
            results.append({"file": {"name": f.filename, "ext": "", "size": 0, "pages": 0}, "candidate": {"name": "", "emails": [], "phones": [], "links": {}, "location": {}}, "summary": "", "skills": [], "languages": [], "experience": [], "education": [], "certifications": [], "projects": [], "awards": [], "publications": [], "total_experience_years": 0.0, "provenance": {"backends": [], "pipeline": [], "blocks": True}, "warnings": [f"parse_error:{type(e).__name__}"]})
    return {"results": results}

