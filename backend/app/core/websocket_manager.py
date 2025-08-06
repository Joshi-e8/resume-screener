"""
WebSocket manager for real-time progress updates
"""

import json
import asyncio
from typing import Dict, List, Any
from fastapi import WebSocket
from loguru import logger


class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Store pending messages for disconnected users
        self.pending_messages: Dict[str, List[str]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}")

        # Send any pending messages
        await self.send_pending_messages(user_id)
        
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
                
            # Clean up empty user entries
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        logger.info(f"WebSocket disconnected for user {user_id}")
        
    async def send_personal_message(self, message: str, user_id: str):
        """Send a message to a specific user"""
        logger.info(f"🔄 Attempting to send message to user {user_id}")
        logger.info(f"📋 Active connections for user {user_id}: {len(self.active_connections.get(user_id, []))}")

        if user_id in self.active_connections:
            disconnected_websockets = []
            sent_count = 0

            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(message)
                    sent_count += 1
                    logger.info(f"✅ Message sent successfully to WebSocket connection {sent_count}")
                except Exception as e:
                    logger.error(f"❌ Error sending message to user {user_id}: {e}")
                    disconnected_websockets.append(websocket)

            # Clean up disconnected websockets
            for ws in disconnected_websockets:
                self.disconnect(ws, user_id)

            logger.info(f"📊 Message sent to {sent_count} connections, {len(disconnected_websockets)} disconnected")
        else:
            logger.warning(f"❌ No active WebSocket connections found for user {user_id}")
            logger.info(f"📋 Available users with connections: {list(self.active_connections.keys())}")

            # Store message for when user reconnects
            await self.store_pending_message(user_id, message)
                
    async def send_progress_update(self, user_id: str, progress_data: Dict[str, Any]):
        """Send progress update to a specific user"""
        logger.info(f"📡 Sending progress update to user {user_id}")
        logger.info(f"📊 Progress data: {progress_data}")

        message = {
            "type": "progress_update",
            "data": progress_data
        }
        await self.send_personal_message(json.dumps(message), user_id)

    async def store_pending_message(self, user_id: str, message: str):
        """Store a message for a disconnected user"""
        if user_id not in self.pending_messages:
            self.pending_messages[user_id] = []

        self.pending_messages[user_id].append(message)
        logger.info(f"📦 Stored pending message for user {user_id}. Total pending: {len(self.pending_messages[user_id])}")

        # Keep only the last 10 messages to prevent memory issues
        if len(self.pending_messages[user_id]) > 10:
            self.pending_messages[user_id] = self.pending_messages[user_id][-10:]

    async def send_pending_messages(self, user_id: str):
        """Send all pending messages to a newly connected user"""
        if user_id in self.pending_messages and self.pending_messages[user_id]:
            logger.info(f"📤 Sending {len(self.pending_messages[user_id])} pending messages to user {user_id}")

            for message in self.pending_messages[user_id]:
                try:
                    await self.send_personal_message(message, user_id)
                except Exception as e:
                    logger.error(f"❌ Failed to send pending message: {e}")

            # Clear pending messages after sending
            self.pending_messages[user_id] = []
            logger.info(f"✅ Cleared pending messages for user {user_id}")
        
    async def send_task_complete(self, user_id: str, task_id: str, results: Dict[str, Any]):
        """Send task completion notification"""
        message = {
            "type": "task_complete",
            "task_id": task_id,
            "data": results
        }
        await self.send_personal_message(json.dumps(message), user_id)
        
    async def send_error(self, user_id: str, error_message: str):
        """Send error notification"""
        message = {
            "type": "error",
            "message": error_message
        }
        await self.send_personal_message(json.dumps(message), user_id)
        
    async def broadcast(self, message: str):
        """Broadcast message to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)
            
    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())
        
    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of connections for a specific user"""
        return len(self.active_connections.get(user_id, []))


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
