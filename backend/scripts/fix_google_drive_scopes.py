#!/usr/bin/env python3
"""
Google Drive Scope Fix Script
Helps resolve OAuth scope mismatch issues
"""

def main():
    print("🔧 Google Drive Scope Mismatch Fix")
    print("=" * 50)
    
    print("❌ You encountered a scope mismatch error. This happens when:")
    print("   • Your Google OAuth app was previously configured with different scopes")
    print("   • Google remembers the old scopes and detects a change")
    print("   • The browser has cached OAuth consent")
    
    print("\n🛠️  Here's how to fix it:")
    
    print("\n1️⃣  CLEAR BROWSER DATA:")
    print("   • Open your browser's developer tools (F12)")
    print("   • Go to Application/Storage tab")
    print("   • Clear all cookies for localhost:3000 and localhost:8000")
    print("   • Or use incognito/private browsing mode")
    
    print("\n2️⃣  UPDATE GOOGLE CLOUD CONSOLE:")
    print("   • Go to: https://console.cloud.google.com/")
    print("   • Navigate to: APIs & Services → Credentials")
    print("   • Edit your OAuth 2.0 Client ID")
    print("   • Ensure these scopes are enabled in your OAuth consent screen:")
    print("     - openid")
    print("     - https://www.googleapis.com/auth/userinfo.email")
    print("     - https://www.googleapis.com/auth/userinfo.profile")
    print("     - https://www.googleapis.com/auth/drive.readonly")
    print("     - https://www.googleapis.com/auth/drive.file")
    
    print("\n3️⃣  VERIFY REDIRECT URIS:")
    print("   Make sure these redirect URIs are added:")
    print("   • http://localhost:8000/auth/callback")
    print("   • http://localhost:8000/api/v1/google-drive/callback")
    
    print("\n4️⃣  TEST THE FIX:")
    print("   • Restart your backend server")
    print("   • Use incognito mode or cleared browser")
    print("   • Try the Google Drive authentication again")
    
    print("\n💡 Alternative Quick Fix:")
    print("   • Go to: https://myaccount.google.com/permissions")
    print("   • Find your Resume Screener app")
    print("   • Remove access completely")
    print("   • Try authentication again (will prompt for all scopes)")
    
    print("\n✅ The scope mismatch has been fixed in the code.")
    print("   The application now requests all necessary scopes upfront.")

if __name__ == "__main__":
    main()
