"""
LinkedIn integration endpoints
"""

import secrets
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.analytics import EventType
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.linkedin_service import LinkedInService
from app.services.user_service import UserService

router = APIRouter()


class LinkedInConnectionRequest(BaseModel):
    """Request to initiate LinkedIn connection"""

    return_url: str = "/dashboard"


class LinkedInJobPostRequest(BaseModel):
    """Request to post job to LinkedIn"""

    job_id: str
    organization_id: str
    job_data: Dict[str, Any]


class LinkedInJobUpdateRequest(BaseModel):
    """Request to update LinkedIn job"""

    external_job_id: str
    updates: Dict[str, Any]


@router.get("/auth/url")
async def get_linkedin_auth_url(
    return_url: str = Query("/dashboard"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get LinkedIn OAuth authorization URL
    """
    linkedin_service = LinkedInService()

    # Generate state parameter for security
    state = secrets.token_urlsafe(32)

    # Store state and return URL in user session (in production, use Redis/database)
    # For now, we'll include it in the state parameter
    state_data = f"{state}:{current_user.id}:{return_url}"

    auth_url = linkedin_service.get_authorization_url(state_data)

    # Track analytics
    analytics_service = AnalyticsService()
    await analytics_service.track_event(
        event_type=EventType.PLATFORM_CONNECTION_INITIATED,
        user_id=str(current_user.id),
        properties={"platform": "linkedin", "action": "auth_url_generated"},
    )

    return {"auth_url": auth_url, "state": state_data, "expires_in": 600}  # 10 minutes


@router.get("/auth/callback")
async def linkedin_auth_callback(
    code: str = Query(...), state: str = Query(...), error: str = Query(None)
) -> RedirectResponse:
    """
    Handle LinkedIn OAuth callback
    """
    if error:
        # Redirect to frontend with error
        return RedirectResponse(
            url=f"/dashboard?error=linkedin_auth_failed&message={error}",
            status_code=302,
        )

    try:
        # Parse state parameter
        state_parts = state.split(":")
        if len(state_parts) != 3:
            raise ValueError("Invalid state parameter")

        state_token, user_id, return_url = state_parts

        # Initialize services
        linkedin_service = LinkedInService()
        user_service = UserService()
        analytics_service = AnalyticsService()

        # Exchange code for token
        token_data = await linkedin_service.exchange_code_for_token(code)
        access_token = token_data["access_token"]

        # Get user profile and organizations
        profile = await linkedin_service.get_user_profile(access_token)
        organizations = await linkedin_service.get_organizations(access_token)

        # Store LinkedIn connection data (in production, encrypt the token)
        connection_data = {
            "platform": "linkedin",
            "access_token": access_token,  # Should be encrypted in production
            "refresh_token": token_data.get("refresh_token"),
            "expires_in": token_data.get("expires_in", 3600),
            "profile": profile,
            "organizations": organizations,
            "connected_at": token_data.get("created_at"),
        }

        # Update user's connected platforms
        await user_service.connect_platform(user_id, "linkedin")

        # Track successful connection
        await analytics_service.track_event(
            event_type=EventType.PLATFORM_CONNECTED,
            user_id=user_id,
            properties={
                "platform": "linkedin",
                "organizations_count": len(organizations),
                "profile_id": profile.get("id"),
            },
        )

        # Redirect to frontend with success
        return RedirectResponse(
            url=f"{return_url}?connected=linkedin&organizations={len(organizations)}",
            status_code=302,
        )

    except Exception as e:
        # Track failed connection
        analytics_service = AnalyticsService()
        await analytics_service.track_event(
            event_type=EventType.PLATFORM_CONNECTION_FAILED,
            user_id=user_id if "user_id" in locals() else "unknown",
            properties={"platform": "linkedin", "error": str(e)},
        )

        # Redirect to frontend with error
        return RedirectResponse(
            url=f"/dashboard?error=linkedin_connection_failed&message={str(e)}",
            status_code=302,
        )


@router.get("/profile")
async def get_linkedin_profile(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get LinkedIn profile information for connected user
    """
    # In production, retrieve stored access token from database
    # For now, return mock data

    return {
        "connected": True,
        "profile": {
            "id": "mock_linkedin_id",
            "firstName": {"localized": {"en_US": "John"}},
            "lastName": {"localized": {"en_US": "Doe"}},
            "profilePicture": {"displayImage": "https://example.com/profile.jpg"},
        },
        "organizations": [
            {
                "id": "123456",
                "name": "Example Company",
                "description": "A great company",
                "industry": ["Technology"],
                "website": "https://example.com",
            }
        ],
    }


@router.post("/jobs/post")
async def post_job_to_linkedin(
    request: LinkedInJobPostRequest, current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Post a job to LinkedIn
    """
    try:
        linkedin_service = LinkedInService()

        # In production, retrieve stored access token from database
        access_token = "mock_access_token"  # Replace with actual token retrieval

        # Post job to LinkedIn
        result = await linkedin_service.post_job(
            access_token=access_token,
            organization_id=request.organization_id,
            job_data=request.job_data,
        )

        # Track analytics
        analytics_service = AnalyticsService()
        await analytics_service.track_event(
            event_type=EventType.JOB_POSTED,
            user_id=str(current_user.id),
            entity_id=request.job_id,
            entity_type="job",
            properties={
                "platform": "linkedin",
                "organization_id": request.organization_id,
                "external_job_id": result["external_job_id"],
            },
        )

        return {"status": "success", "platform": "linkedin", "result": result}

    except Exception as e:
        # Track failed posting
        analytics_service = AnalyticsService()
        await analytics_service.track_event(
            event_type=EventType.JOB_POSTING_FAILED,
            user_id=str(current_user.id),
            entity_id=request.job_id,
            properties={"platform": "linkedin", "error": str(e)},
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to post job to LinkedIn: {str(e)}",
        )


@router.put("/jobs/{external_job_id}")
async def update_linkedin_job(
    external_job_id: str,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Update a LinkedIn job posting
    """
    try:
        linkedin_service = LinkedInService()

        # In production, retrieve stored access token from database
        access_token = "mock_access_token"

        result = await linkedin_service.update_job(
            access_token=access_token, job_id=external_job_id, updates=updates
        )

        return {"status": "success", "platform": "linkedin", "result": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update LinkedIn job: {str(e)}",
        )


@router.delete("/jobs/{external_job_id}")
async def delete_linkedin_job(
    external_job_id: str, current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Delete a LinkedIn job posting
    """
    try:
        linkedin_service = LinkedInService()

        # In production, retrieve stored access token from database
        access_token = "mock_access_token"

        result = await linkedin_service.delete_job(
            access_token=access_token, job_id=external_job_id
        )

        return {"status": "success", "platform": "linkedin", "result": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete LinkedIn job: {str(e)}",
        )


@router.get("/jobs/{external_job_id}/applications")
async def get_linkedin_job_applications(
    external_job_id: str, current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get applications for a LinkedIn job posting
    """
    try:
        linkedin_service = LinkedInService()

        # In production, retrieve stored access token from database
        access_token = "mock_access_token"

        applications = await linkedin_service.get_job_applications(
            access_token=access_token, job_id=external_job_id
        )

        return {
            "status": "success",
            "platform": "linkedin",
            "external_job_id": external_job_id,
            "applications": applications,
            "total_applications": len(applications),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get LinkedIn applications: {str(e)}",
        )


@router.post("/disconnect")
async def disconnect_linkedin(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Disconnect LinkedIn integration
    """
    try:
        user_service = UserService()

        # Remove LinkedIn from connected platforms
        await user_service.disconnect_platform(str(current_user.id), "linkedin")

        # In production, also revoke access tokens and clean up stored data

        # Track disconnection
        analytics_service = AnalyticsService()
        await analytics_service.track_event(
            event_type=EventType.PLATFORM_DISCONNECTED,
            user_id=str(current_user.id),
            properties={"platform": "linkedin"},
        )

        return {
            "status": "success",
            "message": "LinkedIn integration disconnected successfully",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to disconnect LinkedIn: {str(e)}",
        )


@router.get("/connection/status")
async def get_linkedin_connection_status(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get LinkedIn connection status
    """
    # In production, check actual stored connection data
    is_connected = "linkedin" in (current_user.connected_platforms or [])

    if is_connected:
        # In production, validate the stored access token
        linkedin_service = LinkedInService()
        # validation_result = await linkedin_service.validate_connection(access_token)

        return {
            "connected": True,
            "platform": "linkedin",
            "status": "active",  # or validation_result["status"]
            "organizations_count": 1,  # Replace with actual count
            "last_sync": "2024-01-20T10:30:00Z",  # Replace with actual timestamp
        }
    else:
        return {"connected": False, "platform": "linkedin", "status": "disconnected"}
