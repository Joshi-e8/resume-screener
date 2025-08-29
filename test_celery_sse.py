#!/usr/bin/env python3
"""
Test Celery task with SSE progress updates
"""

import asyncio
import aiohttp
import json
import time
import os
import sys
import tempfile
import shutil

# Add backend to path
sys.path.append('backend')

async def test_celery_task_with_sse():
    """Test Celery task execution with SSE progress tracking"""
    
    # Check if resume file exists
    resume_file = "resumes/Joshi_kv_resume.pdf"
    if not os.path.exists(resume_file):
        print(f"❌ Resume file not found: {resume_file}")
        return
    
    print(f"🧪 Testing Celery task with SSE progress tracking")
    print(f"📄 Using resume file: {resume_file}")
    
    # Create a temporary copy of the resume file
    temp_dir = tempfile.mkdtemp()
    temp_file = os.path.join(temp_dir, "test_resume.pdf")
    shutil.copy2(resume_file, temp_file)
    
    try:
        # Generate test IDs
        resume_id = f"test_resume_{int(time.time())}"
        user_id = f"test_user_{int(time.time())}"
        filename = "Joshi_kv_resume.pdf"
        
        print(f"📋 Resume ID: {resume_id}")
        print(f"👤 User ID: {user_id}")
        
        # Start SSE listener in background
        sse_task = asyncio.create_task(track_progress_via_sse(user_id))
        
        # Wait a moment for SSE connection to establish
        await asyncio.sleep(1)
        
        # Import and call the Celery task directly
        print(f"🚀 Starting Celery task...")
        
        from backend.app.tasks.resume_tasks import process_direct_resume_file
        
        # Call the task function directly (not via Celery queue)
        # This simulates what happens when Celery processes the task
        task_result = process_direct_resume_file(
            resume_id=resume_id,
            tmp_file_path=temp_file,
            filename=filename,
            user_id=user_id,
            job_id=None,
            source="direct"
        )
        
        print(f"✅ Task completed!")
        print(f"📋 Task result: {task_result}")
        
        # Wait a bit more for final SSE messages
        await asyncio.sleep(2)
        
        # Cancel the SSE task
        sse_task.cancel()
        
        try:
            await sse_task
        except asyncio.CancelledError:
            pass
        
    finally:
        # Clean up temp file
        try:
            os.unlink(temp_file)
            os.rmdir(temp_dir)
        except:
            pass

async def track_progress_via_sse(user_id: str):
    """Track processing progress via SSE"""
    url = f"http://localhost:8000/api/v1/sse/progress/stream/{user_id}"
    print(f"🔗 Connecting to SSE: {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers={'Accept': 'text/event-stream'}) as response:
                print(f"✅ SSE connection status: {response.status}")
                
                start_time = time.time()
                
                async for line in response.content:
                    line_str = line.decode('utf-8').strip()
                    if line_str.startswith('data: '):
                        data = line_str[6:]
                        try:
                            message = json.loads(data)
                            elapsed = time.time() - start_time
                            
                            if message.get('type') == 'connected':
                                print(f"📨 [{elapsed:.1f}s] Connected to SSE stream")
                            elif message.get('type') == 'progress':
                                progress_data = message.get('data', {})
                                status = progress_data.get('status', 'unknown')
                                msg = progress_data.get('message', 'Processing...')
                                
                                if status == 'processing':
                                    print(f"🔄 [{elapsed:.1f}s] {msg}")
                                elif status == 'completed':
                                    print(f"🎉 [{elapsed:.1f}s] {msg}")
                                    print(f"✅ Processing completed successfully!")
                                    
                                    # Show final results if available
                                    if 'resume_id' in progress_data:
                                        print(f"📋 Resume ID: {progress_data['resume_id']}")
                                    
                                    # Don't break here, let the task finish
                                elif status == 'error':
                                    print(f"❌ [{elapsed:.1f}s] Processing failed: {msg}")
                                    break
                            elif message.get('type') == 'keepalive':
                                print(f"💓 [{elapsed:.1f}s] Keepalive")
                                
                        except json.JSONDecodeError:
                            print(f"📋 Raw SSE data: {data}")
                    elif line_str:
                        print(f"📡 SSE line: {line_str}")
                        
    except asyncio.CancelledError:
        print(f"📡 SSE connection cancelled")
    except Exception as e:
        print(f"❌ SSE connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_celery_task_with_sse())
