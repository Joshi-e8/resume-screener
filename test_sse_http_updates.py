#!/usr/bin/env python3
"""
Test SSE functionality with HTTP-based progress updates
"""

import asyncio
import aiohttp
import requests
import json
import time

async def test_sse_with_http_updates():
    """Test SSE with HTTP-based progress updates"""
    user_id = f"test_user_http_{int(time.time())}"
    
    print(f"🧪 Testing SSE with HTTP updates for user ID: {user_id}")
    
    # Start SSE listener
    async def sse_listener():
        url = f"http://localhost:8000/api/v1/sse/progress/stream/{user_id}"
        print(f"🔗 Connecting to SSE: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers={'Accept': 'text/event-stream'}) as response:
                    print(f"✅ SSE connection status: {response.status}")
                    
                    async for line in response.content:
                        line_str = line.decode('utf-8').strip()
                        if line_str.startswith('data: '):
                            data = line_str[6:]
                            try:
                                message = json.loads(data)
                                print(f"📨 Received: {message}")
                                
                                # Stop after receiving completion
                                if message.get('data', {}).get('status') == 'completed':
                                    print("🎉 Received completion message!")
                                    break
                                    
                            except json.JSONDecodeError:
                                print(f"📋 Raw message: {data}")
                        elif line_str:
                            print(f"📡 SSE line: {line_str}")
                            
        except Exception as e:
            print(f"❌ SSE connection failed: {e}")
    
    # Send progress updates via HTTP API
    def send_http_updates():
        # Wait for SSE connection to establish
        time.sleep(2)
        
        print(f"📤 Sending HTTP progress updates...")
        
        updates = [
            {"message": "Starting resume processing...", "completed": 0, "status": "processing"},
            {"message": "Parsing resume content...", "completed": 0, "status": "processing"},
            {"message": "Analyzing resume against job requirements...", "completed": 0, "status": "processing"},
            {"message": "Creating searchable index...", "completed": 0, "status": "processing"},
            {"message": "Resume processing completed successfully!", "completed": 1, "status": "completed"}
        ]
        
        for i, update in enumerate(updates):
            time.sleep(1.5)
            
            progress_data = {
                'completed': update["completed"],
                'total': 1,
                'status': update["status"],
                'message': update["message"],
                'filename': 'test_resume.pdf'
            }
            
            print(f"📤 Sending HTTP update {i+1}/{len(updates)}: {update['message']}")
            
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
                    print(f"✅ HTTP update sent successfully: {result['streams_updated']} streams updated")
                else:
                    print(f"❌ HTTP update failed: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"❌ Failed to send HTTP update: {e}")
    
    # Run SSE listener and HTTP updates concurrently
    import threading
    
    # Start HTTP updates in a separate thread
    http_thread = threading.Thread(target=send_http_updates)
    http_thread.start()
    
    # Run SSE listener
    await sse_listener()
    
    # Wait for HTTP thread to complete
    http_thread.join()
    
    print("✅ Test completed!")

if __name__ == "__main__":
    asyncio.run(test_sse_with_http_updates())
