"""
Job management endpoints
"""

from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.job import Job, JobCreate, JobResponse, JobStatus, JobUpdate
from app.models.user import User
from app.services.job_service import JobService

router = APIRouter()

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    size: int

@router.get("/", response_model=JobListResponse)
async def get_jobs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    status: JobStatus = Query(None),
    department: str = Query(None),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get jobs with filtering and pagination
    """
    job_service = JobService()
    jobs, total = await job_service.get_jobs(
        user_id=str(current_user.id),
        skip=(page - 1) * size,
        limit=size,
        search=search,
        status=status,
        department=department
    )

    return JobListResponse(
        jobs=[JobResponse.from_orm(job) for job in jobs],
        total=total,
        page=page,
        size=size
    )

@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create new job
    """
    job_service = JobService()
    job = await job_service.create_job(job_data, str(current_user.id))

    # Track analytics event
    from app.models.analytics import EventType
    from app.services.analytics_service import AnalyticsService
    analytics_service = AnalyticsService()
    await analytics_service.track_event(
        event_type=EventType.JOB_CREATED,
        user_id=str(current_user.id),
        entity_id=str(job.id),
        entity_type="job",
        properties={"title": job.title, "department": job.department}
    )

    return JobResponse.from_orm(job)

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get job by ID
    """
    job_service = JobService()
    job = await job_service.get_job_by_id(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if user has access to this job
    if job.user_id != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return JobResponse.from_orm(job)

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update job
    """
    job_service = JobService()
    job = await job_service.update_job(job_id, job_data, str(current_user.id))

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or access denied"
        )

    return JobResponse.from_orm(job)

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete job
    """
    job_service = JobService()
    success = await job_service.delete_job(job_id, str(current_user.id))

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or access denied"
        )

    return {"message": "Job deleted successfully"}

@router.post("/{job_id}/publish", response_model=JobResponse)
async def publish_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Publish job (make it active)
    """
    job_service = JobService()
    job = await job_service.publish_job(job_id, str(current_user.id))

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or access denied"
        )

    return JobResponse.from_orm(job)

@router.post("/{job_id}/pause", response_model=JobResponse)
async def pause_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Pause job
    """
    job_service = JobService()
    job = await job_service.pause_job(job_id, str(current_user.id))

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or access denied"
        )

    return JobResponse.from_orm(job)

@router.get("/{job_id}/analytics")
async def get_job_analytics(
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get job analytics
    """
    job_service = JobService()
    analytics = await job_service.get_job_analytics(job_id, str(current_user.id))

    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or access denied"
        )

    return analytics
