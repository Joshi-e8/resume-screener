#!/usr/bin/env python3
"""
Test complete SSE flow simulating resume processing
"""

import asyncio
import aiohttp
import requests
import json
import time

async def test_complete_sse_flow():
    """Test complete SSE flow with simulated resume processing"""
    
    user_id = f"test_complete_{int(time.time())}"
    
    print(f"🧪 Testing complete SSE flow")
    print(f"👤 User ID: {user_id}")
    
    # Start SSE listener
    sse_task = asyncio.create_task(track_progress_via_sse(user_id))
    
    # Wait for SSE connection to establish
    await asyncio.sleep(1)
    
    # Simulate the complete resume processing flow
    await simulate_resume_processing(user_id)
    
    # Wait a bit more for final messages
    await asyncio.sleep(2)
    
    # Cancel SSE task
    sse_task.cancel()
    try:
        await sse_task
    except asyncio.CancelledError:
        pass
    
    print(f"✅ Complete SSE flow test finished!")

async def simulate_resume_processing(user_id: str):
    """Simulate the complete resume processing flow with SSE updates"""
    
    print(f"🚀 Starting simulated resume processing...")
    
    # Define the processing stages (matching the real Celery task)
    stages = [
        {"message": "Starting resume processing...", "delay": 0.5},
        {"message": "Parsing resume content...", "delay": 2.0},
        {"message": "Analyzing resume against job requirements...", "delay": 3.0},
        {"message": "Creating searchable index...", "delay": 1.5},
        {"message": "Resume processing completed successfully!", "delay": 0.5, "completed": True}
    ]
    
    for i, stage in enumerate(stages):
        # Wait to simulate processing time
        await asyncio.sleep(stage["delay"])
        
        # Prepare progress data
        progress_data = {
            'completed': 1 if stage.get("completed") else 0,
            'total': 1,
            'status': 'completed' if stage.get("completed") else 'processing',
            'message': stage["message"],
            'filename': 'Joshi_kv_resume.pdf'
        }
        
        if stage.get("completed"):
            progress_data.update({
                'resume_id': f'resume_{user_id}',
                'success': True
            })
        
        print(f"📤 Sending stage {i+1}/{len(stages)}: {stage['message']}")
        
        # Send progress update via HTTP API
        try:
            response = requests.post(
                "http://localhost:8000/api/v1/sse/progress/update",
                json={
                    "user_id": user_id,
                    "progress_data": progress_data
                },
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                streams_updated = result.get('streams_updated', 0)
                print(f"✅ HTTP update sent successfully: {streams_updated} streams updated")
            else:
                print(f"❌ HTTP update failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Failed to send HTTP update: {e}")

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
                                print(f"📨 [{elapsed:.1f}s] ✅ Connected to SSE stream")
                            elif message.get('type') == 'progress':
                                progress_data = message.get('data', {})
                                status = progress_data.get('status', 'unknown')
                                msg = progress_data.get('message', 'Processing...')
                                
                                if status == 'processing':
                                    print(f"🔄 [{elapsed:.1f}s] {msg}")
                                elif status == 'completed':
                                    print(f"🎉 [{elapsed:.1f}s] {msg}")
                                    
                                    # Show final results
                                    if 'resume_id' in progress_data:
                                        print(f"📋 [{elapsed:.1f}s] Resume ID: {progress_data['resume_id']}")
                                    if progress_data.get('success'):
                                        print(f"✅ [{elapsed:.1f}s] Processing completed successfully!")
                                    
                                elif status == 'error':
                                    print(f"❌ [{elapsed:.1f}s] Processing failed: {msg}")
                            elif message.get('type') == 'keepalive':
                                print(f"💓 [{elapsed:.1f}s] Keepalive")
                                
                        except json.JSONDecodeError:
                            print(f"📋 Raw SSE data: {data}")
                    elif line_str:
                        print(f"📡 SSE line: {line_str}")
                        
    except asyncio.CancelledError:
        elapsed = time.time() - start_time if 'start_time' in locals() else 0
        print(f"📡 [{elapsed:.1f}s] SSE connection cancelled")
    except Exception as e:
        print(f"❌ SSE connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_complete_sse_flow())
