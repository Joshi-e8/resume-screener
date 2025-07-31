#!/usr/bin/env python3
"""
Test database connection
"""

import asyncio
import os
import sys

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from app.core.database import init_database


async def test_connection():
    """Test database connection"""
    try:
        print("🔄 Testing database connection...")
        await init_database()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)
