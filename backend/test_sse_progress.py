#!/usr/bin/env python3
"""
Test script to simulate progress updates via SSE
"""

import asyncio
import time
from app.core.sse_manager import sse_manager

async def simulate_processing(user_id: str):
    """Simulate file processing with progress updates"""
    print(f"🚀 Starting simulated processing for user: {user_id}")
    
    # Simulate processing 5 files
    total_files = 5
    
    # Initial progress
    await sse_manager.update_progress(user_id, {
        'completed': 0,
        'total': total_files,
        'status': 'processing',
        'message': 'Starting file processing...'
    })
    print("📡 Sent initial progress")
    
    # Simulate processing each file
    for i in range(1, total_files + 1):
        await asyncio.sleep(2)  # Simulate processing time
        
        await sse_manager.update_progress(user_id, {
            'completed': i,
            'total': total_files,
            'status': 'processing',
            'message': f'Processed {i}/{total_files} files...'
        })
        print(f"📡 Sent progress update: {i}/{total_files}")
    
    # Final completion
    await asyncio.sleep(1)
    await sse_manager.update_progress(user_id, {
        'completed': total_files,
        'total': total_files,
        'status': 'completed',
        'message': 'All files processed successfully!',
        'results': [
            {'filename': f'resume{i}.pdf', 'success': True} 
            for i in range(1, total_files + 1)
        ],
        'successful_files': total_files,
        'failed_files': 0
    })
    print("🎉 Sent completion update")

if __name__ == "__main__":
    # Use the same user ID format as your frontend
    test_user_id = "user_1754572116174"  # Use the actual user ID from your SSE connection
    
    print(f"🧪 Testing SSE progress updates for user: {test_user_id}")
    print("📋 Make sure your SSE connection is active in the browser!")
    print("🔗 Connect to: http://localhost:8000/api/v1/sse/progress/stream/{test_user_id}")
    print()
    
    asyncio.run(simulate_processing(test_user_id))
