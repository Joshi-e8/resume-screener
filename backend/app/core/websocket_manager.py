"""
WebSocket manager for real-time progress updates
"""

import json
import time
import redis
from typing import Dict, List, Any
from fastapi import WebSocket
from loguru import logger
from app.core.config import settings


class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        # Store active connections by user_id (local to this process)
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Store pending messages for disconnected users
        self.pending_messages: Dict[str, List[str]] = {}
        # Redis client for cross-process communication
        try:
            # Try Redis URL first, then fall back to individual settings
            if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info(f"🔗 Connecting to Redis via URL: {settings.REDIS_URL}")
            else:
                self.redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_DB,
                    decode_responses=True
                )
                logger.info(f"🔗 Connecting to Redis via host: {settings.REDIS_HOST}:{settings.REDIS_PORT}")

            # Test Redis connection
            ping_result = self.redis_client.ping()
            logger.info(f"✅ Redis connected for WebSocket manager, ping result: {ping_result}")

            # Start Redis pub/sub listener for cross-process messages
            self._start_redis_listener()
        except Exception as e:
            logger.error(f"❌ Redis not available for WebSocket manager: {e}")
            import traceback
            logger.error(f"❌ Redis connection traceback: {traceback.format_exc()}")
            self.redis_client = None
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}")

        # Register connection in Redis for cross-process visibility
        logger.info(f"🔍 Redis client available: {self.redis_client is not None}")
        if self.redis_client:
            try:
                # Store connection info with expiration (30 minutes)
                connection_key = f"ws_connection:{user_id}"
                result = self.redis_client.setex(connection_key, 1800, "active")
                logger.info(f"📡 Registered WebSocket connection in Redis for user {user_id}, result: {result}")
            except Exception as e:
                logger.error(f"❌ Failed to register connection in Redis: {e}")
                import traceback
                logger.error(f"❌ Redis error traceback: {traceback.format_exc()}")
        else:
            logger.warning(f"⚠️ Redis client not available, connection not registered")

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

                # Remove connection from Redis when no local connections remain
                if self.redis_client:
                    try:
                        connection_key = f"ws_connection:{user_id}"
                        self.redis_client.delete(connection_key)
                        logger.info(f"📡 Removed WebSocket connection from Redis for user {user_id}")
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to remove connection from Redis: {e}")

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
        logger.info(f"📡 WebSocket: Sending progress update to user {user_id}")
        logger.info(f"📊 WebSocket: Progress data: {progress_data}")

        # Check if user has active connections (local or via Redis)
        has_local_connection = user_id in self.active_connections
        has_redis_connection = False

        logger.info(f"🔍 Checking connections for {user_id} - Local: {has_local_connection}, Redis client: {self.redis_client is not None}")

        if self.redis_client:
            try:
                connection_key = f"ws_connection:{user_id}"
                has_redis_connection = self.redis_client.exists(connection_key)
                logger.info(f"📡 Redis connection check for {user_id}: {bool(has_redis_connection)} (key: {connection_key})")

                # Also check what keys exist in Redis
                all_keys = self.redis_client.keys("ws_connection:*")
                logger.info(f"📡 All WebSocket keys in Redis: {all_keys}")
            except Exception as e:
                logger.error(f"❌ Failed to check Redis connection: {e}")
                import traceback
                logger.error(f"❌ Redis lookup error traceback: {traceback.format_exc()}")
        else:
            logger.warning(f"⚠️ Redis client not available for connection check")

        if not has_local_connection and not has_redis_connection:
            logger.warning(f"❌ No WebSocket connections found for user {user_id} (local: {has_local_connection}, redis: {has_redis_connection})")
            # Store as pending message
            await self.store_pending_message(user_id, json.dumps({
                "type": "progress",
                "data": progress_data,
                "user_id": user_id,
                "timestamp": time.time()
            }))
            return

        message = {
            "type": "progress",
            "data": progress_data,
            "user_id": user_id,
            "timestamp": time.time()
        }

        # If we have local connections, send directly
        if has_local_connection:
            await self.send_personal_message(json.dumps(message), user_id)
            logger.info(f"✅ WebSocket: Progress update sent locally to user {user_id}")
        # If no local connections but Redis shows active connections, use Redis pub/sub
        elif has_redis_connection and self.redis_client:
            try:
                channel = f"ws_message:{user_id}"
                self.redis_client.publish(channel, json.dumps(message))
                logger.info(f"✅ WebSocket: Progress update sent via Redis pub/sub to user {user_id}")
            except Exception as e:
                logger.error(f"❌ Failed to send message via Redis pub/sub: {e}")
                # Fallback to pending message
                await self.store_pending_message(user_id, json.dumps(message))
        else:
            # Fallback to direct send (shouldn't happen but just in case)
            await self.send_personal_message(json.dumps(message), user_id)
            logger.info(f"✅ WebSocket: Progress update sent (fallback) to user {user_id}")

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

    def _start_redis_listener(self):
        """Start Redis pub/sub listener for cross-process WebSocket messages"""
        if not self.redis_client:
            return

        import asyncio
        import threading

        def redis_listener():
            try:
                pubsub = self.redis_client.pubsub()
                pubsub.psubscribe("ws_message:*")
                logger.info("📡 Started Redis pub/sub listener for WebSocket messages")

                for message in pubsub.listen():
                    if message['type'] == 'pmessage':
                        try:
                            # Extract user_id from channel name
                            channel = message['channel']
                            user_id = channel.split(':', 1)[1]

                            # Parse message data
                            message_data = json.loads(message['data'])

                            # Send to local WebSocket connections if any
                            if user_id in self.active_connections:
                                asyncio.run(self.send_personal_message(json.dumps(message_data), user_id))
                                logger.info(f"📡 Forwarded Redis message to local WebSocket for user {user_id}")
                        except Exception as e:
                            logger.error(f"❌ Error processing Redis message: {e}")
            except Exception as e:
                logger.error(f"❌ Redis listener error: {e}")

        # Start listener in background thread
        listener_thread = threading.Thread(target=redis_listener, daemon=True)
        listener_thread.start()
        logger.info("🚀 Redis pub/sub listener thread started")
        
    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of connections for a specific user"""
        return len(self.active_connections.get(user_id, []))


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
