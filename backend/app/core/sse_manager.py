"""
Server-Sent Events (SSE) Manager for real-time progress updates
"""

import json
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import Request
from fastapi.responses import StreamingResponse
from loguru import logger
import time


class SSEManager:
    """Manages Server-Sent Events for real-time progress updates"""
    
    def __init__(self):
        # Store progress data by user_id
        self.progress_data: Dict[str, Dict[str, Any]] = {}
        # Store active SSE connections by user_id
        self.active_streams: Dict[str, List[asyncio.Queue]] = {}
        # Store completion flags
        self.completed_tasks: Dict[str, bool] = {}
        
    async def update_progress(self, user_id: str, progress_data: Dict[str, Any]):
        """Update progress for a specific user and notify all connected streams"""
        logger.info(f"📡 SSE: Updating progress for user {user_id}")
        logger.info(f"📊 SSE: Progress data: {progress_data}")
        logger.info(f"🔍 SSE: Current active_streams state: {dict(self.active_streams)}")
        logger.info(f"🔍 SSE: SSE manager instance ID: {id(self)}")

        # Store the progress data
        self.progress_data[user_id] = progress_data

        # Mark as completed if status is completed
        if progress_data.get('status') == 'completed':
            self.completed_tasks[user_id] = True
            logger.info(f"✅ SSE: Task completed for user {user_id}")

        # Send to all active streams for this user
        if user_id in self.active_streams:
            logger.info(f"📋 SSE: Found {len(self.active_streams[user_id])} active streams for user {user_id}")
            disconnected_queues = []
            sent_count = 0

            for queue in self.active_streams[user_id]:
                try:
                    # Put progress data in queue (non-blocking)
                    queue.put_nowait({
                        'type': 'progress',
                        'data': progress_data,
                        'timestamp': time.time()
                    })
                    sent_count += 1
                    logger.info(f"✅ SSE: Progress sent to stream queue {sent_count}")
                except asyncio.QueueFull:
                    logger.warning(f"⚠️ SSE: Queue full for user {user_id}, marking for removal")
                    disconnected_queues.append(queue)
                except Exception as e:
                    logger.error(f"❌ SSE: Error sending to queue: {e}")
                    disconnected_queues.append(queue)

            # Clean up disconnected queues
            for queue in disconnected_queues:
                self.active_streams[user_id].remove(queue)

            # Clean up empty user entries
            if not self.active_streams[user_id]:
                del self.active_streams[user_id]

            logger.info(f"📊 SSE: Successfully sent to {sent_count} active streams")
        else:
            logger.info(f"📋 SSE: No active streams for user {user_id}. Available users: {list(self.active_streams.keys())}")
            logger.info(f"🔍 SSE: Total active streams across all users: {sum(len(streams) for streams in self.active_streams.values())}")
    
    async def create_stream(self, user_id: str, request: Request) -> StreamingResponse:
        """Create a new SSE stream for a user"""
        logger.info(f"🔗 SSE: Creating new stream for user {user_id}")
        logger.info(f"🔍 SSE: SSE manager instance ID in create_stream: {id(self)}")

        # Create a queue for this stream
        queue = asyncio.Queue(maxsize=100)

        # Add to active streams BEFORE creating the generator
        if user_id not in self.active_streams:
            self.active_streams[user_id] = []
        self.active_streams[user_id].append(queue)
        logger.info(f"📋 SSE: Added stream to active streams. Total streams for user {user_id}: {len(self.active_streams[user_id])}")
        logger.info(f"🔍 SSE: Current active_streams after adding: {dict(self.active_streams)}")

        async def event_stream():
            try:
                # Send initial connection message
                yield self._format_sse_message({
                    'type': 'connected',
                    'message': f'Connected to progress updates for user {user_id}',
                    'user_id': user_id
                })

                # Send current progress if available
                if user_id in self.progress_data:
                    current_progress = self.progress_data[user_id]
                    yield self._format_sse_message({
                        'type': 'progress',
                        'data': current_progress
                    })
                    logger.info(f"📤 SSE: Sent current progress to new stream")

                # Add a small delay to ensure the stream is fully established
                await asyncio.sleep(0.1)
                
                # Keep connection alive and send updates
                while True:
                    try:
                        # Check if client disconnected
                        if await request.is_disconnected():
                            logger.info(f"🔌 SSE: Client disconnected for user {user_id}")
                            break
                        
                        # Wait for new messages with timeout (increased to 60 seconds for resume processing)
                        try:
                            message = await asyncio.wait_for(queue.get(), timeout=60.0)
                            yield self._format_sse_message(message)

                            # If task is completed, close the stream after sending
                            if message.get('data', {}).get('status') == 'completed':
                                logger.info(f"🎉 SSE: Task completed, closing stream for user {user_id}")
                                break
                            elif message.get('data', {}).get('status') == 'error':
                                logger.info(f"❌ SSE: Task failed, closing stream for user {user_id}")
                                break

                        except asyncio.TimeoutError:
                            # Send keepalive message every 60 seconds
                            yield self._format_sse_message({
                                'type': 'keepalive',
                                'timestamp': time.time()
                            })
                            
                    except Exception as e:
                        logger.error(f"❌ SSE: Error in event stream: {e}")
                        break
                        
            except Exception as e:
                logger.error(f"❌ SSE: Error in event stream generator: {e}")
            finally:
                # Clean up this stream
                if user_id in self.active_streams and queue in self.active_streams[user_id]:
                    self.active_streams[user_id].remove(queue)
                    if not self.active_streams[user_id]:
                        del self.active_streams[user_id]
                logger.info(f"🧹 SSE: Cleaned up stream for user {user_id}")
        
        return StreamingResponse(
            event_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control",
            }
        )
    
    def _format_sse_message(self, data: Dict[str, Any]) -> str:
        """Format data as SSE message"""
        json_data = json.dumps(data)
        return f"data: {json_data}\n\n"
    
    def get_progress(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get current progress for a user"""
        return self.progress_data.get(user_id)
    
    def cleanup_user(self, user_id: str):
        """Clean up all data for a user"""
        if user_id in self.progress_data:
            del self.progress_data[user_id]
        if user_id in self.active_streams:
            del self.active_streams[user_id]
        if user_id in self.completed_tasks:
            del self.completed_tasks[user_id]
        logger.info(f"🧹 SSE: Cleaned up all data for user {user_id}")
    
    def get_connection_count(self) -> int:
        """Get total number of active SSE connections"""
        return sum(len(streams) for streams in self.active_streams.values())


# Global SSE manager instance
sse_manager = SSEManager()
