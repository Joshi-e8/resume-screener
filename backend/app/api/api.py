"""
Main API router
"""

from fastapi import APIRouter

from app.api.endpoints import (
    analysis,
    analytics,
    auth,
    candidates,
    health,
    jobs,
    linkedin,
    platforms,
    resumes,
    users,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(platforms.router, prefix="/platforms", tags=["platforms"])
api_router.include_router(linkedin.router, prefix="/linkedin", tags=["linkedin"])
