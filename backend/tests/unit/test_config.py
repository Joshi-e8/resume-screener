#!/usr/bin/env python3
"""
Test configuration loading from .env file
"""

import os
import sys

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "."))

from app.core.config import settings


def test_config():
    """Test configuration values"""
    print("🔍 Testing configuration loading...")
    print(f"MONGODB_URL: {settings.MONGODB_URL}")
    print(f"MONGODB_DB_NAME: {settings.MONGODB_DB_NAME}")
    print(f"GROQ_API_KEY: {settings.GROQ_API_KEY}")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"LOG_LEVEL: {settings.LOG_LEVEL}")

    # Check if .env values are being loaded
    expected_url = "mongodb://Localhost:Pass%401234@localhost:27017/resume_screener?authSource=admin"

    if settings.MONGODB_URL == expected_url:
        print("✅ MongoDB URL loaded correctly from .env")
    else:
        print("❌ MongoDB URL NOT loaded from .env")
        print(f"Expected: {expected_url}")
        print(f"Got: {settings.MONGODB_URL}")

    if settings.MONGODB_DB_NAME == "resume_screener":
        print("✅ MongoDB DB name loaded correctly from .env")
    else:
        print("❌ MongoDB DB name NOT loaded from .env")


if __name__ == "__main__":
    test_config()
