"""
Health check endpoints
"""

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {"status": "healthy", "service": "Resume Screener API", "version": "1.0.0"}


@router.get("/database")
async def database_health():
    """Database connection health check"""
    try:
        # Create a new client for health check
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)

        # Test database connection
        await client.admin.command("ping")

        # Get database info
        db = client[settings.MONGODB_DB_NAME]
        collections = await db.list_collection_names()

        # Close the client
        client.close()

        return {
            "status": "healthy",
            "database": settings.MONGODB_DB_NAME,
            "collections": collections,
            "connection": "active",
        }
    except Exception:  # noqa: E722
        raise HTTPException(
            status_code=503, detail=f"Database connection failed: {str(Exception)}"
        )
