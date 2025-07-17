"""
Resume analysis endpoints
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_analyses():
    """List all resume analyses"""
    return {"message": "Analysis endpoints - Coming soon"}


@router.post("/analyze")
async def analyze_resumes():
    """Analyze resumes against job description"""
    return {"message": "Resume analysis - Coming soon"}
