#!/usr/bin/env python3
"""
Test SSE endpoint directly
"""

import asyncio
import aiohttp
import json
import sys
import os

# Add backend to path
sys.path.append('backend')

async def test_sse_endpoint():
    """Test the SSE endpoint and send updates"""
    user_id = "test_user_endpoint"
    
    print(f"🧪 Testing SSE endpoint with user ID: {user_id}")
    
    # Start SSE connection
    async def sse_listener():
        url = f"http://localhost:8000/api/v1/sse/progress/stream/{user_id}"
        print(f"🔗 Connecting to: {url}")
        
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
    
    # Send progress updates
    async def send_updates():
        # Wait a bit for SSE connection to establish
        await asyncio.sleep(2)
        
        from backend.app.core.sse_manager import sse_manager
        
        print(f"📤 Sending progress updates...")
        
        updates = [
            {"message": "Starting processing...", "completed": 0, "status": "processing"},
            {"message": "Parsing content...", "completed": 0, "status": "processing"},
            {"message": "Processing complete!", "completed": 1, "status": "completed"}
        ]
        
        for i, update in enumerate(updates):
            await asyncio.sleep(1)
            
            progress_data = {
                'completed': update["completed"],
                'total': 1,
                'status': update["status"],
                'message': update["message"],
                'filename': 'test.pdf'
            }
            
            print(f"📤 Sending update {i+1}/{len(updates)}: {update['message']}")
            await sse_manager.update_progress(user_id, progress_data)
    
    # Run both tasks concurrently
    await asyncio.gather(
        sse_listener(),
        send_updates(),
        return_exceptions=True
    )

if __name__ == "__main__":
    asyncio.run(test_sse_endpoint())
