"""
WebSocket endpoints for real-time communication
"""

import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket_manager import websocket_manager
from loguru import logger

router = APIRouter()


@router.websocket("/ws/progress/{user_id}")
async def websocket_progress_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time progress updates
    """
    await websocket_manager.connect(websocket, user_id)
    
    try:
        # Send initial connection confirmation
        await websocket_manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": f"Connected to progress updates for user {user_id}",
                "user_id": user_id
            }),
            user_id
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket_manager.send_personal_message(
                        json.dumps({"type": "pong"}),
                        user_id
                    )
                elif message.get("type") == "subscribe":
                    # Client subscribing to specific updates
                    await websocket_manager.send_personal_message(
                        json.dumps({
                            "type": "subscribed",
                            "message": f"Subscribed to updates for {user_id}"
                        }),
                        user_id
                    )
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket_manager.send_error(user_id, "Invalid JSON message")
            except Exception as e:
                logger.error(f"Error in WebSocket endpoint: {e}")
                await websocket_manager.send_error(user_id, f"Server error: {str(e)}")
                
    except WebSocketDisconnect:
        pass
    finally:
        websocket_manager.disconnect(websocket, user_id)


@router.websocket("/ws/status")
async def websocket_status_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for general status updates
    """
    await websocket.accept()
    
    try:
        while True:
            # Send periodic status updates
            status = {
                "type": "status",
                "active_connections": websocket_manager.get_connection_count(),
                "timestamp": str(asyncio.get_event_loop().time())
            }
            
            await websocket.send_text(json.dumps(status))
            await asyncio.sleep(30)  # Send status every 30 seconds
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Error in status WebSocket: {e}")
    finally:
        await websocket.close()


# Health check endpoint for WebSocket
@router.get("/ws/health")
async def websocket_health():
    """
    Health check for WebSocket service
    """
    return {
        "status": "healthy",
        "active_connections": websocket_manager.get_connection_count(),
        "service": "websocket"
    }


# Test endpoint to send progress update
@router.post("/ws/test-progress/{user_id}")
async def test_progress_update(user_id: str):
    """
    Test endpoint to send a progress update to a specific user
    """
    test_progress = {
        "completed": 5,
        "total": 10,
        "status": "processing",
        "message": "Test progress update"
    }

    await websocket_manager.send_progress_update(user_id, test_progress)

    return {
        "status": "sent",
        "user_id": user_id,
        "progress": test_progress,
        "active_connections": websocket_manager.get_connection_count()
    }


# Progress update endpoint for Celery tasks
@router.post("/ws/progress/{user_id}")
async def send_progress_update(user_id: str, progress_data: dict):
    """
    Send progress update to a specific user via WebSocket
    Used by Celery tasks to send progress updates
    """
    await websocket_manager.send_progress_update(user_id, progress_data)

    return {
        "status": "sent",
        "user_id": user_id,
        "progress": progress_data,
        "active_connections": websocket_manager.get_connection_count()
    }
