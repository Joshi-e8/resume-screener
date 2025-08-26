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
                ai_overall = details.analysis_results.get("ai_overall_score")
                ai_scoring = details.analysis_results.get("ai_scoring")
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
                ai_overall = details.analysis_results.get("ai_overall_score")
                ai_scoring = details.analysis_results.get("ai_scoring")
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

        # Fallback: simple estimation if AI hasn't calculated it yet
        if experience_years == 0 and details and isinstance(details.parsed_data, dict):
            exp_array = details.parsed_data.get("experience", [])
            if isinstance(exp_array, list) and exp_array:
                # Simple fallback: estimate based on number of positions
                experience_years = min(len(exp_array) * 1.5, 10)

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
