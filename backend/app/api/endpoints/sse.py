"""
Server-Sent Events (SSE) endpoints for real-time progress updates
"""

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from app.core.sse_manager import sse_manager
from loguru import logger
from typing import Any, Dict

router = APIRouter()


class ProgressUpdateRequest(BaseModel):
    """Request model for sending progress updates"""
    user_id: str
    progress_data: Dict[str, Any]


@router.get("/progress/stream/{user_id}")
async def progress_stream(user_id: str, request: Request):
    """
    Create SSE stream for real-time progress updates
    
    This endpoint creates a Server-Sent Events stream that will send
    real-time progress updates for the specified user.
    
    Args:
        user_id: Unique identifier for the user/session
        request: FastAPI request object for connection management
        
    Returns:
        StreamingResponse with SSE formatted progress updates
    """
    try:
        logger.info(f"🔗 Creating SSE stream for user: {user_id}")
        return await sse_manager.create_stream(user_id, request)
    except Exception as e:
        logger.error(f"❌ Failed to create SSE stream for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create progress stream: {str(e)}"
        )


@router.get("/progress/status/{user_id}")
async def get_progress_status(user_id: str) -> Any:
    """
    Get current progress status for a user
    
    This endpoint provides a one-time snapshot of the current
    progress status without establishing a streaming connection.
    
    Args:
        user_id: Unique identifier for the user/session
        
    Returns:
        Current progress data or null if no progress found
    """
    try:
        progress = sse_manager.get_progress(user_id)
        
        if progress is None:
            return {
                "user_id": user_id,
                "status": "not_found",
                "message": "No progress data found for this user"
            }
        
        return {
            "user_id": user_id,
            "progress": progress,
            "status": "found"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get progress status for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get progress status: {str(e)}"
        )


@router.delete("/progress/{user_id}")
async def cleanup_progress(user_id: str) -> Any:
    """
    Clean up progress data for a user
    
    This endpoint removes all stored progress data and closes
    any active SSE connections for the specified user.
    
    Args:
        user_id: Unique identifier for the user/session
        
    Returns:
        Confirmation message
    """
    try:
        sse_manager.cleanup_user(user_id)
        
        return {
            "user_id": user_id,
            "status": "cleaned_up",
            "message": "Progress data and connections cleaned up successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to cleanup progress for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup progress: {str(e)}"
        )


@router.get("/connections/status")
async def get_connections_status() -> Any:
    """
    Get SSE connections status
    
    This endpoint provides information about active SSE connections
    for monitoring and debugging purposes.
    
    Returns:
        Connection statistics and status information
    """
    try:
        connection_count = sse_manager.get_connection_count()
        
        return {
            "active_connections": connection_count,
            "status": "healthy",
            "message": f"SSE manager is running with {connection_count} active connections"
        }

    except Exception as e:
        logger.error(f"❌ Failed to get connections status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connections status: {str(e)}"
        )


@router.post("/progress/update")
async def send_progress_update(request: ProgressUpdateRequest) -> Any:
    """
    Send a progress update to SSE streams

    This endpoint allows external processes (like Celery tasks) to send
    progress updates to active SSE streams in the FastAPI server process.

    Args:
        request: Progress update request containing user_id and progress_data

    Returns:
        Success status and number of streams updated
    """
    try:
        logger.info(f"📡 SSE API: Received progress update for user {request.user_id}")
        logger.info(f"📊 SSE API: Progress data: {request.progress_data}")

        # Send the progress update using the SSE manager
        await sse_manager.update_progress(request.user_id, request.progress_data)

        # Get the number of active streams for this user
        stream_count = len(sse_manager.active_streams.get(request.user_id, []))

        return {
            "user_id": request.user_id,
            "status": "success",
            "message": f"Progress update sent to {stream_count} active streams",
            "streams_updated": stream_count
        }

    except Exception as e:
        logger.error(f"❌ Failed to send progress update: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send progress update: {str(e)}"
        )
