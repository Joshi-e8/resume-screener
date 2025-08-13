#!/usr/bin/env python3
"""
Test the full flow: API endpoint -> Celery task -> SSE updates
"""

import asyncio
import requests
import time
from app.core.sse_manager import sse_manager

def test_api_endpoint():
    """Test the bulk upload API endpoint directly"""
    print("🧪 Testing API endpoint directly...")
    
    # Test data
    test_data = {
        'file_ids': ['test_file_1', 'test_file_2', 'test_file_3'],
        'access_token': 'test_token_123',
        'user_id': 'test_user_api_123',
        'async_processing': True
    }
    
    try:
        # Build URL with query parameters
        base_url = "http://localhost:8000/api/v1/google-drive/bulk-upload-resumes"
        params = {
            'access_token': test_data['access_token'],
            'user_id': test_data['user_id'],
            'async_processing': test_data['async_processing']
        }
        
        # Add file_ids as multiple parameters
        for file_id in test_data['file_ids']:
            params[f'file_ids'] = file_id
        
        print(f"📤 Making request to: {base_url}")
        print(f"📊 Parameters: {params}")
        
        response = requests.post(base_url, params=params, timeout=30)
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response data: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('async_processing'):
                print(f"✅ Async processing started with batch_id: {data.get('batch_id')}")
                print(f"✅ Task ID: {data.get('task_id')}")
                return data.get('task_id'), test_data['user_id']
            else:
                print("⚠️ Synchronous processing was used instead of async")
        else:
            print(f"❌ API request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
    
    return None, None

async def monitor_sse_progress(user_id: str, duration: int = 30):
    """Monitor SSE progress for a user"""
    print(f"👁️ Monitoring SSE progress for user: {user_id}")
    
    start_time = time.time()
    last_progress = None
    
    while time.time() - start_time < duration:
        try:
            current_progress = sse_manager.get_progress(user_id)
            
            if current_progress and current_progress != last_progress:
                print(f"📊 Progress update: {current_progress}")
                last_progress = current_progress
                
                if current_progress.get('status') == 'completed':
                    print("🎉 Processing completed!")
                    break
            
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"❌ Error monitoring progress: {e}")
            break
    
    print(f"⏰ Monitoring finished after {time.time() - start_time:.1f} seconds")

def check_celery_task_status(task_id: str):
    """Check Celery task status"""
    if not task_id:
        return
        
    print(f"🔍 Checking Celery task status: {task_id}")
    
    try:
        from app.core.celery_app import celery_app
        
        result = celery_app.AsyncResult(task_id)
        print(f"📋 Task state: {result.state}")
        print(f"📋 Task info: {result.info}")
        
        if result.state == 'PENDING':
            print("⚠️ Task is pending - might not be picked up by worker")
        elif result.state == 'STARTED':
            print("🔄 Task is running")
        elif result.state == 'SUCCESS':
            print("✅ Task completed successfully")
        elif result.state == 'FAILURE':
            print(f"❌ Task failed: {result.info}")
            
    except Exception as e:
        print(f"❌ Error checking task status: {e}")

async def main():
    """Main test function"""
    print("🔧 Full Flow Test - API -> Celery -> SSE")
    print("=" * 50)
    
    # Test 1: Direct API call
    task_id, user_id = test_api_endpoint()
    
    if not task_id or not user_id:
        print("❌ API test failed, cannot continue")
        return
    
    print("\n" + "=" * 30)
    
    # Test 2: Check task status
    check_celery_task_status(task_id)
    
    print("\n" + "=" * 30)
    
    # Test 3: Monitor SSE progress
    await monitor_sse_progress(user_id, duration=60)
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print(f"   API Endpoint: ✅ Called")
    print(f"   Task ID: {task_id}")
    print(f"   User ID: {user_id}")
    print("\n💡 Check your Celery worker logs for task execution details")

if __name__ == "__main__":
    asyncio.run(main())
