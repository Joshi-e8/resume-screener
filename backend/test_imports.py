#!/usr/bin/env python3
"""
Test script to verify all required packages are installed correctly
"""

def test_imports():
    """Test importing all required packages"""
    try:
        # Core FastAPI packages
        import fastapi
        import uvicorn
        print("✅ FastAPI packages imported successfully")
        
        # Database packages
        import motor
        import pymongo
        import beanie
        print("✅ Database packages imported successfully")
        
        # AI and ML packages
        import groq
        import pdfplumber
        print("✅ AI/ML packages imported successfully")
        
        # File handling
        import aiofiles
        print("✅ File handling packages imported successfully")
        
        # Validation
        import pydantic
        import pydantic_settings
        print("✅ Validation packages imported successfully")
        
        # Security
        import passlib
        import jose
        print("✅ Security packages imported successfully")
        
        # Utilities
        import pandas
        import requests
        import httpx
        print("✅ Utility packages imported successfully")
        
        print("\n🎉 All packages imported successfully!")
        print("Backend environment is ready for development!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_imports()
