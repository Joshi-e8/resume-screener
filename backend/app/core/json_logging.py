"""
JSON logging utilities for structured logs
"""
import json
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pathlib import Path


def json_log(message: str, **kwargs):
    """Simple JSON logging function that prints to stdout"""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": message,
    }
    log_entry.update(kwargs)
    print(json.dumps(log_entry, ensure_ascii=False, default=str))


def setup_json_logging(log_level: str = "INFO", enable_file_logging: bool = True):
    """Setup JSON logging configuration - simplified version"""
    # For now, we'll use the simple json_log function
    # This avoids complex loguru configuration issues
    pass


def log_resume_processing(
    event: str,
    filename: str,
    resume_id: Optional[str] = None,
    job_id: Optional[str] = None,
    processing_time_ms: Optional[int] = None,
    status: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    **kwargs
):
    """Log resume processing events in structured JSON format"""
    log_data = {
        "level": "INFO",
        "event_type": "resume_processing",
        "event": event,
        "filename": filename,
    }

    if resume_id:
        log_data["resume_id"] = resume_id
    if job_id:
        log_data["job_id"] = job_id
    if processing_time_ms:
        log_data["processing_time_ms"] = processing_time_ms
    if status:
        log_data["status"] = status
    if details:
        log_data["details"] = details

    # Add any additional kwargs
    log_data.update(kwargs)

    json_log("Resume processing event", **log_data)


def log_ai_scoring(
    event: str,
    resume_id: Optional[str] = None,
    job_id: Optional[str] = None,
    overall_score: Optional[float] = None,
    breakdown: Optional[Dict[str, float]] = None,
    processing_time_ms: Optional[int] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    cache_hit: Optional[bool] = None,
    **kwargs
):
    """Log AI scoring events in structured JSON format"""
    log_data = {
        "level": "INFO",
        "event_type": "ai_scoring",
        "event": event,
    }

    if resume_id:
        log_data["resume_id"] = resume_id
    if job_id:
        log_data["job_id"] = job_id
    if overall_score is not None:
        log_data["overall_score"] = overall_score
    if breakdown:
        log_data["breakdown"] = breakdown
    if processing_time_ms:
        log_data["processing_time_ms"] = processing_time_ms
    if provider:
        log_data["provider"] = provider
    if model:
        log_data["model"] = model
    if cache_hit is not None:
        log_data["cache_hit"] = cache_hit

    # Add any additional kwargs
    log_data.update(kwargs)

    json_log("AI scoring event", **log_data)


def log_parsed_resume(
    filename: str,
    resume_id: Optional[str] = None,
    candidate_name: Optional[str] = None,
    candidate_email: Optional[str] = None,
    candidate_phone: Optional[str] = None,
    skills: Optional[list] = None,
    experience_years: Optional[float] = None,
    education: Optional[list] = None,
    sections_found: Optional[list] = None,
    quality_score: Optional[float] = None,
    processing_time_ms: Optional[int] = None,
    **kwargs
):
    """Log parsed resume data in structured JSON format"""
    log_data = {
        "level": "INFO",
        "event_type": "resume_parsing",
        "event": "resume_parsed",
        "filename": filename,
    }

    if resume_id:
        log_data["resume_id"] = resume_id
    if candidate_name:
        log_data["candidate_name"] = candidate_name
    if candidate_email:
        log_data["candidate_email"] = candidate_email
    if candidate_phone:
        log_data["candidate_phone"] = candidate_phone
    if skills:
        log_data["skills"] = skills
        log_data["skills_count"] = len(skills)
    if experience_years is not None:
        log_data["experience_years"] = experience_years
    if education:
        log_data["education"] = education
        log_data["education_count"] = len(education)
    if sections_found:
        log_data["sections_found"] = sections_found
        log_data["sections_count"] = len(sections_found)
    if quality_score is not None:
        log_data["quality_score"] = quality_score
    if processing_time_ms:
        log_data["processing_time_ms"] = processing_time_ms

    # Add any additional kwargs
    log_data.update(kwargs)

    json_log("Resume parsed successfully", **log_data)


def log_database_operation(
    operation: str,
    collection: str,
    document_id: Optional[str] = None,
    status: str = "success",
    processing_time_ms: Optional[int] = None,
    error: Optional[str] = None,
    **kwargs
):
    """Log database operations in structured JSON format"""
    log_data = {
        "level": "INFO" if status == "success" else "ERROR",
        "event_type": "database_operation",
        "operation": operation,
        "collection": collection,
        "status": status,
    }

    if document_id:
        log_data["document_id"] = document_id
    if processing_time_ms:
        log_data["processing_time_ms"] = processing_time_ms
    if error:
        log_data["error"] = error

    # Add any additional kwargs
    log_data.update(kwargs)

    if status == "success":
        json_log("Database operation completed", **log_data)
    else:
        json_log("Database operation failed", **log_data)
