#!/usr/bin/env python3
"""
Test script for SSE implementation
"""

import asyncio
import json
from app.core.sse_manager import sse_manager

async def test_sse_manager():
    """Test the SSE manager functionality"""
    print("🧪 Testing SSE Manager...")
    
    # Test user ID
    test_user_id = "test_user_123"
    
    # Test 1: Update progress
    print("\n📊 Test 1: Updating progress...")
    await sse_manager.update_progress(test_user_id, {
        'completed': 0,
        'total': 5,
        'status': 'processing',
        'message': 'Starting test processing...'
    })
    
    # Test 2: Get progress
    print("\n📋 Test 2: Getting progress...")
    progress = sse_manager.get_progress(test_user_id)
    print(f"Retrieved progress: {progress}")
    
    # Test 3: Simulate processing updates
    print("\n🔄 Test 3: Simulating processing updates...")
    for i in range(1, 6):
        await asyncio.sleep(1)  # Simulate processing time
        await sse_manager.update_progress(test_user_id, {
            'completed': i,
            'total': 5,
            'status': 'processing',
            'message': f'Processed {i}/5 files...'
        })
        print(f"✅ Updated progress: {i}/5")
    
    # Test 4: Complete processing
    print("\n🎉 Test 4: Completing processing...")
    await sse_manager.update_progress(test_user_id, {
        'completed': 5,
        'total': 5,
        'status': 'completed',
        'message': 'Processing completed successfully!',
        'results': [
            {'filename': 'resume1.pdf', 'success': True},
            {'filename': 'resume2.pdf', 'success': True},
            {'filename': 'resume3.pdf', 'success': True},
            {'filename': 'resume4.pdf', 'success': True},
            {'filename': 'resume5.pdf', 'success': True},
        ],
        'successful_files': 5,
        'failed_files': 0
    })
    
    # Test 5: Check connection count
    print("\n📊 Test 5: Connection count...")
    count = sse_manager.get_connection_count()
    print(f"Active connections: {count}")
    
    # Test 6: Cleanup
    print("\n🧹 Test 6: Cleanup...")
    sse_manager.cleanup_user(test_user_id)
    
    final_progress = sse_manager.get_progress(test_user_id)
    print(f"Progress after cleanup: {final_progress}")
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(test_sse_manager())
