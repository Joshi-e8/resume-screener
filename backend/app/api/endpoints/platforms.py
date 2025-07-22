"""
Job board platform integration endpoints
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.user import User
from app.services.platform_service import PlatformService
from app.services.job_posting_service import JobPostingService

router = APIRouter()

class PlatformConnection(BaseModel):
    platform_id: str
    platform_name: str
    connected: bool
    connection_status: str
    last_sync: str = None
    features: List[str]

class JobPostingRequest(BaseModel):
    job_id: str
    platforms: List[str]
    custom_settings: dict = {}

class JobPostingResult(BaseModel):
    platform: str
    success: bool
    external_job_id: str = None
    error_message: str = None
    posted_url: str = None

@router.get("/", response_model=List[PlatformConnection])
async def get_platform_connections(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get all platform connections for user
    """
    platform_service = PlatformService()
    connections = await platform_service.get_user_connections(str(current_user.id))
    return connections

@router.post("/{platform_id}/connect")
async def connect_platform(
    platform_id: str,
    auth_data: dict,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Connect to a job board platform
    """
    platform_service = PlatformService()
    
    try:
        connection = await platform_service.connect_platform(
            user_id=str(current_user.id),
            platform_id=platform_id,
            auth_data=auth_data
        )
        return {
            "message": f"Successfully connected to {platform_id}",
            "connection": connection
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect to {platform_id}: {str(e)}"
        )

@router.delete("/{platform_id}/disconnect")
async def disconnect_platform(
    platform_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Disconnect from a job board platform
    """
    platform_service = PlatformService()
    
    try:
        await platform_service.disconnect_platform(
            user_id=str(current_user.id),
            platform_id=platform_id
        )
        return {"message": f"Successfully disconnected from {platform_id}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to disconnect from {platform_id}: {str(e)}"
        )

@router.post("/{platform_id}/test")
async def test_platform_connection(
    platform_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Test platform connection
    """
    platform_service = PlatformService()
    
    try:
        result = await platform_service.test_connection(
            user_id=str(current_user.id),
            platform_id=platform_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection test failed: {str(e)}"
        )

@router.post("/post-job", response_model=List[JobPostingResult])
async def post_job_to_platforms(
    posting_request: JobPostingRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Post job to multiple platforms simultaneously
    """
    job_posting_service = JobPostingService()
    
    try:
        results = await job_posting_service.post_to_multiple_platforms(
            user_id=str(current_user.id),
            job_id=posting_request.job_id,
            platforms=posting_request.platforms,
            custom_settings=posting_request.custom_settings
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to post job: {str(e)}"
        )

@router.get("/{platform_id}/jobs")
async def get_platform_jobs(
    platform_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get jobs posted on specific platform
    """
    platform_service = PlatformService()
    
    try:
        jobs = await platform_service.get_platform_jobs(
            user_id=str(current_user.id),
            platform_id=platform_id
        )
        return jobs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch jobs from {platform_id}: {str(e)}"
        )

@router.post("/{platform_id}/sync")
async def sync_platform_data(
    platform_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Sync data from platform (applications, views, etc.)
    """
    platform_service = PlatformService()
    
    try:
        sync_result = await platform_service.sync_platform_data(
            user_id=str(current_user.id),
            platform_id=platform_id
        )
        return sync_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to sync data from {platform_id}: {str(e)}"
        )

@router.get("/{platform_id}/analytics")
async def get_platform_analytics(
    platform_id: str,
    days: int = 30,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get analytics for specific platform
    """
    platform_service = PlatformService()
    
    try:
        analytics = await platform_service.get_platform_analytics(
            user_id=str(current_user.id),
            platform_id=platform_id,
            days=days
        )
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get analytics for {platform_id}: {str(e)}"
        )

@router.get("/supported")
async def get_supported_platforms() -> Any:
    """
    Get list of supported job board platforms
    """
    return {
        "platforms": [
            {
                "id": "linkedin",
                "name": "LinkedIn",
                "description": "Professional network with quality candidates",
                "features": ["job_posting", "candidate_sourcing", "company_branding"],
                "pricing": "freemium"
            },
            {
                "id": "indeed",
                "name": "Indeed",
                "description": "World's largest job site",
                "features": ["job_posting", "resume_database", "sponsored_jobs"],
                "pricing": "freemium"
            },
            {
                "id": "glassdoor",
                "name": "Glassdoor",
                "description": "Employer branding and reviews",
                "features": ["job_posting", "employer_branding", "salary_insights"],
                "pricing": "premium"
            },
            {
                "id": "ziprecruiter",
                "name": "ZipRecruiter",
                "description": "AI-powered job distribution",
                "features": ["multi_site_posting", "ai_matching", "one_click_apply"],
                "pricing": "premium"
            }
        ]
    }
