#!/usr/bin/env python3
"""
Debug script to check Celery status and test task execution
"""

import asyncio
from app.core.celery_app import celery_app
from app.tasks.resume_tasks import process_bulk_resumes_task
from app.core.sse_manager import sse_manager

def check_celery_status():
    """Check if Celery is running and accessible"""
    print("🔍 Checking Celery status...")
    
    try:
        # Check if Celery app is configured
        print(f"📋 Celery app name: {celery_app.main}")
        print(f"📋 Celery broker: {celery_app.conf.broker_url}")
        print(f"📋 Celery backend: {celery_app.conf.result_backend}")
        
        # Check active workers
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        if active_workers:
            print(f"✅ Active workers found: {list(active_workers.keys())}")
            for worker, tasks in active_workers.items():
                print(f"   Worker {worker}: {len(tasks)} active tasks")
        else:
            print("❌ No active workers found!")
            print("💡 Make sure to start Celery worker with:")
            print("   celery -A app.core.celery_app worker --loglevel=info")
        
        # Check registered tasks
        registered_tasks = list(celery_app.tasks.keys())
        print(f"📋 Registered tasks: {len(registered_tasks)}")
        for task in registered_tasks:
            if 'resume' in task.lower():
                print(f"   📄 {task}")
        
        return active_workers is not None and len(active_workers) > 0
        
    except Exception as e:
        print(f"❌ Error checking Celery status: {e}")
        return False

def test_simple_task():
    """Test a simple Celery task"""
    print("\n🧪 Testing simple task execution...")
    
    try:
        # Test with minimal data
        test_user_id = "debug_user_123"
        test_file_ids = ["test_file_1", "test_file_2"]
        test_access_token = "test_token"
        test_credentials = {
            "token": "test_token",
            "client_id": "test_client_id",
            "client_secret": "test_client_secret",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
        
        print(f"📤 Queuing task for user: {test_user_id}")
        
        # Queue the task
        result = process_bulk_resumes_task.delay(
            test_file_ids,
            test_access_token,
            test_credentials,
            test_user_id,
            None  # job_id
        )
        
        print(f"✅ Task queued with ID: {result.id}")
        print(f"📋 Task state: {result.state}")
        
        # Wait a bit and check status
        import time
        time.sleep(2)
        
        print(f"📋 Task state after 2s: {result.state}")
        if result.state == 'PENDING':
            print("⚠️ Task is still pending - worker might not be running")
        elif result.state == 'STARTED':
            print("🔄 Task has started processing")
        elif result.state == 'SUCCESS':
            print("✅ Task completed successfully")
        elif result.state == 'FAILURE':
            print(f"❌ Task failed: {result.info}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error testing task: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return None

async def test_sse_direct():
    """Test SSE manager directly"""
    print("\n🧪 Testing SSE manager directly...")
    
    test_user_id = "debug_user_123"
    
    try:
        # Test direct SSE update
        await sse_manager.update_progress(test_user_id, {
            'completed': 1,
            'total': 3,
            'status': 'processing',
            'message': 'Direct SSE test message'
        })
        
        print("✅ Direct SSE update sent successfully")
        
        # Check if data was stored
        stored_progress = sse_manager.get_progress(test_user_id)
        if stored_progress:
            print(f"✅ Progress data stored: {stored_progress}")
        else:
            print("❌ No progress data found")
        
        # Check connection count
        connections = sse_manager.get_connection_count()
        print(f"📊 Active SSE connections: {connections}")
        
    except Exception as e:
        print(f"❌ Error testing SSE: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")

def main():
    """Main debug function"""
    print("🔧 Resume Screener - Celery & SSE Debug Tool")
    print("=" * 50)
    
    # Check Celery status
    celery_ok = check_celery_status()
    
    if not celery_ok:
        print("\n❌ Celery workers not running!")
        print("💡 Start Celery worker first:")
        print("   cd backend")
        print("   celery -A app.core.celery_app worker --loglevel=info")
        print("\n🔄 You can still test SSE functionality...")
    
    # Test SSE directly
    asyncio.run(test_sse_direct())
    
    if celery_ok:
        # Test task execution
        test_simple_task()
    
    print("\n" + "=" * 50)
    print("🎯 Debug Summary:")
    print(f"   Celery Workers: {'✅ Running' if celery_ok else '❌ Not Running'}")
    print("   SSE Manager: ✅ Available")
    print("\n💡 Next steps:")
    if not celery_ok:
        print("   1. Start Celery worker")
        print("   2. Test file upload with SSE connection active")
    else:
        print("   1. Test file upload with SSE connection active")
        print("   2. Check backend logs for task execution")

if __name__ == "__main__":
    main()
