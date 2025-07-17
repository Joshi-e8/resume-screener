"""
Job description management endpoints
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_jobs():
    """List all job descriptions"""
    return {"message": "Job endpoints - Coming soon"}


@router.post("/")
async def create_job():
    """Create new job description"""
    return {"message": "Job creation - Coming soon"}
