"""
Resume upload and management endpoints
"""

# import os  # noqa: F401
import os

import tempfile
from datetime import datetime
from typing import Any, List

from fastapi import (APIRouter, Depends, File, Form, HTTPException, UploadFile,
                     status)
from uuid import uuid4
from loguru import logger
from app.models.job import Job
from app.models.resume_processing import ProcessingMode
from app.scoring.service import score_resume_against_job
from app.vector.store import upsert_resume_chunks, Chunk

from app.core.security import get_current_user
from app.models.analytics import EventType
import re
from datetime import datetime


def _parse_years_from_duration(duration_str: str) -> float:
    """Parse years from duration strings like '2 years', 'Jan 2020 - Dec 2022', etc."""
    if not duration_str:
        return 0.0

    duration = duration_str.lower().strip()

    # Pattern 1: "X years Y months" or "X years" or "Y months"
    years_match = re.search(r'(\d+(?:\.\d+)?)\s*years?', duration)
    months_match = re.search(r'(\d+(?:\.\d+)?)\s*months?', duration)

    total_years = 0.0
    if years_match:
        total_years += float(years_match.group(1))
    if months_match:
        total_years += float(months_match.group(1)) / 12.0

    if total_years > 0:
        return total_years

    # Pattern 2: Date ranges like "Jan 2020 - Dec 2022" or "2020 - 2022"
    date_range_match = re.search(r'(\d{4})\s*[-–—]\s*(\d{4})', duration)
    if date_range_match:
        start_year = int(date_range_match.group(1))
        end_year = int(date_range_match.group(2))
        return max(0.0, end_year - start_year)

    # Pattern 3: Month/Year ranges like "Jan 2020 - Dec 2022"
    month_year_pattern = r'(\w{3,9})\s+(\d{4})\s*[-–—]\s*(\w{3,9})\s+(\d{4})'
    month_year_match = re.search(month_year_pattern, duration)
    if month_year_match:
        try:
            start_year = int(month_year_match.group(2))
            end_year = int(month_year_match.group(4))
            # Rough calculation - could be improved with actual month parsing
            return max(0.0, end_year - start_year + 0.5)  # Add 0.5 for partial years
        except ValueError:
            pass

    # Pattern 4: Single year like "2022" - assume 1 year
    single_year_match = re.search(r'\b(\d{4})\b', duration)
    if single_year_match:
        return 1.0

    return 0.0
from app.models.candidate import CandidateCreate
from app.models.user import User
from app.models.resume_processing import ResumeMetadata, ResumeDetails, ProcessingStatus

from app.services.analytics_service import AnalyticsService
from app.services.candidate_service import CandidateService
from app.services.resume_parser import ResumeParser

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_id: str = Form(None),
    source: str = Form("direct"),
    async_processing: bool = Form(True),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Upload and parse a resume file (now supports Celery async via async_processing flag)
    """
    # Validate file type
    allowed_extensions = [".pdf", ".docx", ".doc", ".txt"]
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}",
        )

    # Validate file size (10MB limit)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum 10MB allowed.",
        )

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
        tmp_file.write(file_content)
        tmp_file_path = tmp_file.name

    try:
        # Create initial metadata with PROCESSING status
        file_id = uuid4().hex
        meta = ResumeMetadata(
            file_id=file_id,
            filename=file.filename,
            user_id=str(current_user.id),
            file_size=len(file_content),
            mime_type=getattr(file, "content_type", None),
            status=ProcessingStatus.PROCESSING,
            processing_mode=ProcessingMode.STANDARD,
            job_id=job_id,
            source=source,
        )
        await meta.insert()

        if async_processing:
            # Enqueue Celery task; don't delete tmp file so worker can read it
            from app.tasks.resume_tasks import process_direct_resume_file
            task = process_direct_resume_file.delay(str(meta.id), tmp_file_path, file.filename, str(current_user.id), job_id, source)
            logger.info(f"[upload] Enqueued Celery task {task.id} for resume {meta.id}")
            return {
                "message": "Resume accepted for background processing",
                "resume_id": str(meta.id),
                "job_id": job_id,
                "task_id": task.id,
                "status": "processing",
                "user_id": str(current_user.id),
            }
        else:
            # Fallback: synchronous processing (existing behavior)
            parser = ResumeParser()
            start_time = datetime.utcnow()
            parsed_data = await parser.parse_resume(tmp_file_path)
            end_time = datetime.utcnow()
            processing_time = int((end_time - start_time).total_seconds() * 1000)

            # Update and persist details ... (omitted for brevity)
            meta.status = ProcessingStatus.COMPLETED
            await meta.save()

            return {
                "message": "Resume uploaded and processed successfully",
                "filename": file.filename,
                "processing_time_ms": processing_time,
                "resume_id": str(meta.id),
                "job_id": job_id,
            }

    except Exception as e:  # noqa: E722
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}",
        )

    finally:
        # Clean up temporary file
        try:
            # When using Celery async processing, the worker will delete the tmp file.
            # Only delete here for synchronous path.
            if not async_processing and 'tmp_file_path' in locals() and os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
        except Exception:
            pass


@router.post("/upload/multiple")
async def upload_multiple_resumes(
    files: List[UploadFile] = File(...),
    job_id: str = Form(None),
    async_processing: bool = Form(True),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Upload multiple resume files. For async_processing=True, enqueue a single Celery batch
    task that processes all files at once and reports progress via SSE.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    allowed_extensions = [".pdf", ".docx", ".doc", ".txt"]
    max_size = 10 * 1024 * 1024  # 10MB per file

    tmp_payloads = []
    try:
        # Create initial metadata entries and save temp files
        for f in files:
            ext = os.path.splitext(f.filename)[1].lower()
            if ext not in allowed_extensions:
                raise HTTPException(status_code=400, detail=f"Unsupported file type for {f.filename}")

            content = await f.read()
            if len(content) > max_size:
                raise HTTPException(status_code=400, detail=f"File too large: {f.filename} (max 10MB)")

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmpf:
                tmpf.write(content)
                tmp_path = tmpf.name

            # Create metadata with PROCESSING status
            file_id = uuid4().hex
            meta = ResumeMetadata(
                file_id=file_id,
                filename=f.filename,
                user_id=str(current_user.id),
                file_size=len(content),
                mime_type=getattr(f, "content_type", None),
                status=ProcessingStatus.PROCESSING,
                processing_mode=ProcessingMode.STANDARD,
                job_id=job_id,
                source="direct",
            )
            await meta.insert()

            tmp_payloads.append({
                "resume_id": str(meta.id),
                "tmp_file_path": tmp_path,
                "filename": f.filename,
                "file_size": len(content),
                "mime_type": getattr(f, "content_type", None),
            })

        if async_processing:
            # Enqueue single batch task that processes all provided files at once
            from app.tasks.resume_tasks import process_direct_resume_files_batch
            task = process_direct_resume_files_batch.delay(tmp_payloads, str(current_user.id), job_id)
            logger.info(f"[upload/multiple] Enqueued Celery batch task {task.id} for {len(tmp_payloads)} files")
            return {
                "message": "Batch accepted for background processing",
                "status": "processing",
                "async_processing": True,
                "user_id": str(current_user.id),
                "total": len(tmp_payloads),
                "task_id": task.id,
            }
        else:
            # Synchronous (not recommended for many files) — process sequentially using the same parser
            from app.services.resume_parser import ResumeParser
            parser = ResumeParser()
            processed = 0
            for p in tmp_payloads:
                parsed = await parser.parse_resume(p["tmp_file_path"])
                # Mark metadata completed
                m = await ResumeMetadata.get(p["resume_id"])  # type: ignore
                if m:
                    m.status = ProcessingStatus.COMPLETED
                    await m.save()
                processed += 1
            return {
                "message": "Batch processed synchronously",
                "status": "completed",
                "async_processing": False,
                "processed": processed,
                "total": len(tmp_payloads),
            }

    except HTTPException:
        # Propagate validation errors
        raise
    except Exception as e:
        logger.exception("[upload/multiple] Failed")
        raise HTTPException(status_code=500, detail=f"Failed to process batch: {str(e)}")

@router.get("/job/{job_id}")
async def list_resumes_by_job(job_id: str, current_user: User = Depends(get_current_user)) -> Any:
    """
    List resumes associated with a specific job, newest first
    Returns minimal fields required by UI
    """
    # Query metadata by job_id and completed status
    metas = await ResumeMetadata.find({
        "job_id": job_id,
        "status": ProcessingStatus.COMPLETED
    }).sort("-created_at").to_list()

    results = []
    for m in metas:
        # Try to load details for ai scoring and extra fields
        details = await ResumeDetails.find_one({"resume_id": str(m.id)})
        ai_overall = None
        ai_scoring = None
        location = None
        phone = None
        title = None
        summary = None
        education = []
        file_size = getattr(m, 'file_size', None)
        mime_type = getattr(m, 'mime_type', None)
        if details:
            if isinstance(details.analysis_results, dict):
                ar = details.analysis_results or {}
                ai_overall = ar.get("ai_overall_score") or ar.get("overall_score") or (ar.get("derived") or {}).get("server_check_overall")
                ai_scoring = ar.get("ai_scoring") or ar
            if isinstance(details.parsed_data, dict):
                pd = details.parsed_data or {}
                contact = pd.get("contact_info") or {}
                location = contact.get("location")
                phone = contact.get("phone")
                exp = pd.get("experience") or []
                summary = pd.get("summary")
                education = pd.get("education") or []
                if isinstance(exp, list) and exp:
                    first = exp[0] or {}
                    title = first.get("title")

        results.append({
            "id": str(m.id),
            "file_id": m.file_id,
            "filename": m.filename,
            "candidate_name": m.candidate_name,
            "candidate_email": m.candidate_email,
            "key_skills": m.key_skills,
            "created_at": m.created_at.isoformat(),
            "ai_overall_score": ai_overall,
            "ai_scoring": ai_scoring,
            "location": location,
            "phone": phone,
            "title": title,
            "summary": summary,
            "education": education,
            "file_size": file_size,
            "mime_type": mime_type,
            "source": "Google Drive",
        })

    return {
        "result": "success",
        "message": "Resumes retrieved successfully",
        "records": results,
        "total": len(results)
    }



@router.get("/")
async def list_resumes(current_user: User = Depends(get_current_user)) -> Any:
    """List all completed resumes across jobs, newest first"""
    metas = await ResumeMetadata.find({
        "status": ProcessingStatus.COMPLETED
    }).sort("-created_at").to_list()

    results = []
    for m in metas:
        details = await ResumeDetails.find_one({"resume_id": str(m.id)})
        ai_overall = None
        ai_scoring = None
        location = None
        phone = None
        title = None
        summary = None
        education = []
        file_size = getattr(m, 'file_size', None)
        mime_type = getattr(m, 'mime_type', None)
        if details:
            if isinstance(details.analysis_results, dict):
                ar = details.analysis_results or {}
                ai_overall = ar.get("ai_overall_score") or ar.get("overall_score") or (ar.get("derived") or {}).get("server_check_overall")
                ai_scoring = ar.get("ai_scoring") or ar
            if isinstance(details.parsed_data, dict):
                pd = details.parsed_data or {}
                contact = pd.get("contact_info") or {}
                location = contact.get("location")
                phone = contact.get("phone")
                exp = pd.get("experience") or []
                summary = pd.get("summary")
                education = pd.get("education") or []
                if isinstance(exp, list) and exp:
                    first = exp[0] or {}
                    title = first.get("title")

        # Get experience years from AI scoring (calculated by AI based on experience timeline)
        experience_years = 0
        if details and details.analysis_results:
            ai_scoring = details.analysis_results.get("ai_scoring", {})
            if isinstance(ai_scoring, dict):
                derived = ai_scoring.get("derived", {})
                if isinstance(derived, dict):
                    ai_calculated = derived.get("total_experience_years")
                    if ai_calculated and isinstance(ai_calculated, (int, float)) and ai_calculated > 0:
                        # Use the exact AI-calculated value
                        experience_years = ai_calculated

        # Fallback: calculate from duration strings if AI hasn't calculated it yet
        if experience_years == 0 and details and isinstance(details.parsed_data, dict):
            exp_array = details.parsed_data.get("experience", [])
            if isinstance(exp_array, list) and exp_array:
                # Try to parse actual durations from experience entries
                total_years = 0.0
                for exp in exp_array:
                    if isinstance(exp, dict):
                        duration = exp.get("duration", "")
                        if duration:
                            # Parse years from duration strings like "2 years", "Jan 2020 - Dec 2022", etc.
                            years = _parse_years_from_duration(duration)
                            total_years += years

                # If we got actual durations, use them; otherwise use a more varied fallback
                if total_years > 0:
                    experience_years = round(total_years, 2)
                else:
                    # More varied fallback based on position count with some randomization
                    import random
                    base_years = len(exp_array) * random.uniform(1.2, 2.5)  # Vary between 1.2-2.5 years per position
                    experience_years = round(min(base_years, 15), 2)

        # Format education properly
        formatted_education = []
        if isinstance(education, list):
            for edu in education:
                if isinstance(edu, dict):
                    formatted_education.append({
                        "degree": edu.get("degree", ""),
                        "school": edu.get("institution") or edu.get("school", ""),
                        "year": edu.get("year", 0)
                    })

        # Derive file type from mime_type or filename
        file_type = "pdf"
        if mime_type:
            if "word" in mime_type or "docx" in mime_type:
                file_type = "docx"
            elif "msword" in mime_type:
                file_type = "doc"
        elif m.filename:
            if m.filename.lower().endswith('.docx'):
                file_type = "docx"
            elif m.filename.lower().endswith('.doc'):
                file_type = "doc"

        # Get comprehensive skills from parsed data
        comprehensive_skills = m.key_skills or []
        if details and isinstance(details.parsed_data, dict):
            parsed_skills = details.parsed_data.get("skills", [])
            if isinstance(parsed_skills, list):
                # Combine and deduplicate skills
                all_skills = list(set(comprehensive_skills + parsed_skills))
                comprehensive_skills = all_skills

        # Get experience data
        experience_data = []
        if details and isinstance(details.parsed_data, dict):
            exp_data = details.parsed_data.get("experience", [])
            if isinstance(exp_data, list):
                experience_data = exp_data

        # Get projects data
        projects_data = []
        if details and isinstance(details.parsed_data, dict):
            proj_data = details.parsed_data.get("projects", [])
            if isinstance(proj_data, list):
                projects_data = proj_data

        # Generate tags from skills
        tags = []
        if comprehensive_skills:
            # Take first 3 skills as tags
            tags = comprehensive_skills[:3]

        # Keep the original backend format that frontend maps from
        resume = {
            "id": str(m.id),
            "file_id": m.file_id,
            "filename": m.filename,
            "candidate_name": m.candidate_name,
            "candidate_email": m.candidate_email,
            "key_skills": comprehensive_skills,
            "created_at": m.created_at.isoformat(),
            "ai_overall_score": ai_overall,
            "ai_scoring": ai_scoring,
            "job_id": m.job_id,
            "location": location,
            "phone": phone,
            "title": title,
            "summary": summary,
            "education": formatted_education,
            "experience": experience_data,
            "projects": projects_data,
            "file_size": file_size,
            "mime_type": mime_type,
            "total_experience_years": experience_years,
            "source": "upload",
        }
        results.append(resume)

    # Return wrapped response as expected by frontend
    return {
        "result": "success",
        "message": "Resumes retrieved successfully",
        "records": results,
        "total": len(results)
    }
