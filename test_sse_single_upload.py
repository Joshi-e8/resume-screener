#!/usr/bin/env python3
"""
Test script to verify SSE functionality for single file resume upload
"""

import asyncio
import aiohttp
import json
import time
from pathlib import Path

async def test_sse_connection(user_id: str):
    """Test SSE connection and listen for progress updates"""
    url = f"http://localhost:8000/api/v1/sse/progress/stream/{user_id}"
    
    print(f"🔗 Connecting to SSE stream: {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                print(f"✅ SSE connection established (status: {response.status})")
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        data = line[6:]  # Remove 'data: ' prefix
                        try:
                            progress_data = json.loads(data)
                            print(f"📊 Progress update: {progress_data}")
                            
                            # Check if processing is completed
                            if progress_data.get('data', {}).get('status') == 'completed':
                                print("🎉 Processing completed!")
                                break
                                
                        except json.JSONDecodeError:
                            print(f"📋 SSE message: {data}")
                    elif line.startswith('event: '):
                        event_type = line[7:]  # Remove 'event: ' prefix
                        print(f"📡 Event type: {event_type}")
                        
    except Exception as e:
        print(f"❌ SSE connection failed: {e}")

async def simulate_processing_updates(user_id: str):
    """Simulate processing updates to test SSE"""
    from backend.app.core.sse_manager import sse_manager
    
    print(f"🚀 Starting simulated processing for user {user_id}")
    
    # Simulate processing stages
    stages = [
        {"message": "Starting resume processing...", "completed": 0},
        {"message": "Parsing resume content...", "completed": 0},
        {"message": "Analyzing resume against job requirements...", "completed": 0},
        {"message": "Creating searchable index...", "completed": 0},
        {"message": "Resume processing completed successfully!", "completed": 1, "status": "completed"}
    ]
    
    for i, stage in enumerate(stages):
        await asyncio.sleep(2)  # Simulate processing time
        
        progress_data = {
            'completed': stage["completed"],
            'total': 1,
            'status': stage.get("status", "processing"),
            'message': stage["message"],
            'filename': 'test_resume.pdf'
        }
        
        print(f"📤 Sending progress update {i+1}/{len(stages)}: {stage['message']}")
        await sse_manager.update_progress(user_id, progress_data)

async def main():
    """Main test function"""
    user_id = f"test_user_{int(time.time())}"
    print(f"🧪 Testing SSE with user ID: {user_id}")
    
    # Start SSE listener and processing simulation concurrently
    sse_task = asyncio.create_task(test_sse_connection(user_id))
    processing_task = asyncio.create_task(simulate_processing_updates(user_id))
    
    # Wait for both tasks to complete
    await asyncio.gather(sse_task, processing_task, return_exceptions=True)
    
    print("✅ Test completed!")

if __name__ == "__main__":
    asyncio.run(main())
