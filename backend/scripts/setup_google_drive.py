#!/usr/bin/env python3
"""
Google Drive Integration Setup Script
Helps configure Google Drive API credentials for the Resume Screener
"""

import os
import sys
from pathlib import Path


def main():
    print("🔧 Google Drive Integration Setup")
    print("=" * 50)
    
    # Get the backend directory
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"
    
    print(f"📁 Backend directory: {backend_dir}")
    print(f"📄 Environment file: {env_file}")
    
    # Check if .env file exists
    if not env_file.exists():
        print("❌ .env file not found!")
        print("   Please create a .env file in the backend directory first.")
        print("   You can copy from .env.example:")
        print(f"   cp {backend_dir}/.env.example {env_file}")
        return
    
    # Read current .env file
    with open(env_file, 'r') as f:
        env_content = f.read()
    
    print("\n🔍 Checking current Google credentials...")
    
    # Check for existing Google credentials
    has_google_client_id = "GOOGLE_CLIENT_ID=" in env_content and not env_content.split("GOOGLE_CLIENT_ID=")[1].split("\n")[0].strip().startswith("your-")
    has_google_client_secret = "GOOGLE_CLIENT_SECRET=" in env_content and not env_content.split("GOOGLE_CLIENT_SECRET=")[1].split("\n")[0].strip().startswith("your-")
    
    if has_google_client_id and has_google_client_secret:
        print("✅ Found existing Google OAuth credentials")
        print("   Google Drive will use these credentials automatically")
        
        # Check if Google Drive redirect URI is configured
        if "GOOGLE_DRIVE_REDIRECT_URI=" not in env_content:
            print("\n📝 Adding Google Drive redirect URI...")
            with open(env_file, 'a') as f:
                f.write("\n# Google Drive Integration\n")
                f.write("GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8000/api/v1/google-drive/callback\n")
            print("✅ Added GOOGLE_DRIVE_REDIRECT_URI to .env file")
        else:
            print("✅ Google Drive redirect URI already configured")
            
    else:
        print("❌ Google OAuth credentials not found or not configured")
        print("\n📋 Please configure your Google OAuth credentials:")
        print("   1. Go to Google Cloud Console: https://console.cloud.google.com/")
        print("   2. Navigate to APIs & Services → Credentials")
        print("   3. Create or edit OAuth 2.0 Client ID")
        print("   4. Add these redirect URIs:")
        print("      - http://localhost:8000/auth/callback (for social auth)")
        print("      - http://localhost:8000/api/v1/google-drive/callback (for Drive)")
        print("   5. Update your .env file with:")
        print("      GOOGLE_CLIENT_ID=your_actual_client_id")
        print("      GOOGLE_CLIENT_SECRET=your_actual_client_secret")
        return
    
    print("\n🔧 Google Drive API Requirements:")
    print("   ✅ Google Drive API must be enabled in Google Cloud Console")
    print("   ✅ OAuth consent screen must be configured")
    print("   ✅ Redirect URI must include: http://localhost:8000/api/v1/google-drive/callback")
    
    print("\n🧪 Testing Configuration...")
    
    # Test import
    try:
        sys.path.append(str(backend_dir))
        from app.core.config import settings
        
        client_id = settings.GOOGLE_DRIVE_CLIENT_ID or settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_DRIVE_CLIENT_SECRET or settings.GOOGLE_CLIENT_SECRET
        redirect_uri = settings.GOOGLE_DRIVE_REDIRECT_URI
        
        if client_id and client_secret and redirect_uri:
            print("✅ Configuration loaded successfully")
            print(f"   Client ID: {client_id[:10]}...")
            print(f"   Redirect URI: {redirect_uri}")
        else:
            print("❌ Configuration incomplete")
            
    except Exception as e:
        print(f"❌ Error loading configuration: {e}")
        return
    
    print("\n🚀 Next Steps:")
    print("   1. Start the backend server:")
    print("      cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
    print("   2. Start the frontend:")
    print("      cd frontend && npm run dev")
    print("   3. Navigate to: http://localhost:3000/dashboard/resumes/upload")
    print("   4. Select 'Google Drive' upload mode and test the integration")
    
    print("\n✨ Google Drive integration is ready!")

if __name__ == "__main__":
    main()
