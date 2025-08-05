"""
Resume upload and management endpoints
"""

import os
import tempfile
from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.core.security import get_current_user
from app.models.analytics import EventType
from app.models.candidate import CandidateCreate
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.candidate_service import CandidateService
from app.services.resume_parser import ResumeParser

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_id: str = Form(None),
    source: str = Form("direct"),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Upload and parse a resume file
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
        # Parse resume
        parser = ResumeParser()
        start_time = datetime.utcnow()
        parsed_data = await parser.parse_resume(tmp_file_path)
        end_time = datetime.utcnow()
        processing_time = int((end_time - start_time).total_seconds() * 1000)

        return {
            "message": "Resume uploaded and processed successfully",
            "filename": file.filename,
            "parsed_data": parsed_data,
            "processing_time_ms": processing_time,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}",
        )

    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)


@router.get("/")
async def list_resumes():
    """List all uploaded resumes"""
    return {"message": "Resume endpoints - Coming soon"}
