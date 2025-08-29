#!/usr/bin/env python3
"""
Test real resume upload with SSE progress tracking
"""

import asyncio
import aiohttp
import requests
import json
import time
import os

async def test_real_resume_upload():
    """Test uploading a real resume file with SSE progress tracking"""
    
    # Check if resume file exists
    resume_file = "resumes/Joshi_kv_resume.pdf"
    if not os.path.exists(resume_file):
        print(f"❌ Resume file not found: {resume_file}")
        return
    
    print(f"🧪 Testing real resume upload with SSE progress tracking")
    print(f"📄 Using resume file: {resume_file}")
    
    # Step 1: Upload the resume file
    print(f"📤 Step 1: Uploading resume file...")
    
    try:
        with open(resume_file, 'rb') as f:
            files = {'file': f}
            data = {'async_processing': 'true'}
            
            # Note: In a real scenario, we'd need proper authentication
            # For testing, we'll use a mock token or skip auth
            response = requests.post(
                "http://localhost:8000/api/v1/resumes/upload",
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                upload_result = response.json()
                print(f"✅ Upload successful!")
                print(f"📋 Upload response: {upload_result}")
                
                user_id = upload_result.get('user_id')
                if not user_id:
                    print(f"❌ No user_id in upload response")
                    return
                
                print(f"👤 User ID for SSE tracking: {user_id}")
                
                # Step 2: Connect to SSE stream for progress updates
                print(f"📡 Step 2: Connecting to SSE stream...")
                await track_progress_via_sse(user_id)
                
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"📋 Error response: {response.text}")
                
    except Exception as e:
        print(f"❌ Upload error: {e}")

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
                                completed = progress_data.get('completed', 0)
                                total = progress_data.get('total', 1)
                                
                                if status == 'processing':
                                    print(f"🔄 [{elapsed:.1f}s] {msg}")
                                elif status == 'completed':
                                    print(f"🎉 [{elapsed:.1f}s] {msg}")
                                    print(f"✅ Processing completed successfully!")
                                    
                                    # Show final results if available
                                    if 'resume_id' in progress_data:
                                        print(f"📋 Resume ID: {progress_data['resume_id']}")
                                    
                                    break
                                elif status == 'error':
                                    print(f"❌ [{elapsed:.1f}s] Processing failed: {msg}")
                                    break
                            elif message.get('type') == 'keepalive':
                                print(f"💓 [{elapsed:.1f}s] Keepalive")
                                
                        except json.JSONDecodeError:
                            print(f"📋 Raw SSE data: {data}")
                    elif line_str:
                        print(f"📡 SSE line: {line_str}")
                        
                total_time = time.time() - start_time
                print(f"⏱️ Total processing time: {total_time:.1f} seconds")
                        
    except Exception as e:
        print(f"❌ SSE connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_real_resume_upload())
