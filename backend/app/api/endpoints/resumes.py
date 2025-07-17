"""
Resume upload and management endpoints
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_resumes():
    """List all uploaded resumes"""
    return {"message": "Resume endpoints - Coming soon"}


@router.post("/upload")
async def upload_resume():
    """Upload resume file(s)"""
    return {"message": "Resume upload - Coming soon"}
