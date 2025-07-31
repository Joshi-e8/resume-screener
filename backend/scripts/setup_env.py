#!/usr/bin/env python3
"""
Environment setup script for Resume Screener Backend
"""

import os
import secrets
import shutil
from pathlib import Path


def generate_secret_key(length: int = 64) -> str:
    """Generate a secure secret key"""
    return secrets.token_urlsafe(length)

def setup_environment():
    """Set up environment files and directories"""
    
    print("🚀 Setting up Resume Screener Backend Environment...")
    
    # Get the backend directory
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"
    env_example = backend_dir / ".env.example"
    
    # Create .env from .env.example if it doesn't exist
    if not env_file.exists():
        if env_example.exists():
            print("📄 Creating .env from .env.example...")
            shutil.copy(env_example, env_file)
            
            # Generate a secure secret key
            secret_key = generate_secret_key()
            
            # Read the .env file
            with open(env_file, 'r') as f:
                content = f.read()
            
            # Replace the default secret key
            content = content.replace(
                'SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars',
                f'SECRET_KEY={secret_key}'
            )
            
            # Write back to .env
            with open(env_file, 'w') as f:
                f.write(content)
            
            print(f"✅ Generated secure SECRET_KEY")
        else:
            print("❌ .env.example not found!")
            return False
    else:
        print("✅ .env file already exists")
    
    # Create upload directory
    upload_dir = backend_dir / "uploads"
    if not upload_dir.exists():
        upload_dir.mkdir(parents=True, exist_ok=True)
        print("✅ Created uploads directory")
    
    # Create logs directory
    logs_dir = backend_dir / "logs"
    if not logs_dir.exists():
        logs_dir.mkdir(parents=True, exist_ok=True)
        print("✅ Created logs directory")
    
    # Create temp directory for file processing
    temp_dir = backend_dir / "temp"
    if not temp_dir.exists():
        temp_dir.mkdir(parents=True, exist_ok=True)
        print("✅ Created temp directory")
    
    print("\n📋 Environment Setup Complete!")
    print("\n🔧 Next Steps:")
    print("1. Edit .env file with your actual API keys and database URL")
    print("2. Set up MongoDB database")
    print("3. Configure LinkedIn Developer App (if using LinkedIn integration)")
    print("4. Run: python -m uvicorn app.main:app --reload")
    
    print("\n🔑 Required API Keys (add to .env):")
    print("   - MONGODB_URL (for database)")
    print("   - LINKEDIN_CLIENT_ID & LINKEDIN_CLIENT_SECRET (for LinkedIn integration)")
    print("   - GROQ_API_KEY (for AI features)")
    print("   - INDEED_API_KEY (for Indeed integration)")
    
    return True

def validate_environment():
    """Validate environment configuration"""

    print("🔍 Validating Environment Configuration...")

    try:
        import os
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        from app.core.config import settings

        # Check required settings
        required_settings = [
            ('MONGODB_URL', settings.MONGODB_URL),
            ('MONGODB_DB_NAME', settings.MONGODB_DB_NAME),
            ('SECRET_KEY', settings.SECRET_KEY),
        ]
        
        missing_settings = []
        
        for name, value in required_settings:
            if not value or value == "":
                missing_settings.append(name)
            else:
                print(f"✅ {name}: configured")
        
        # Check optional but important settings
        optional_settings = [
            ('LINKEDIN_CLIENT_ID', settings.LINKEDIN_CLIENT_ID),
            ('GROQ_API_KEY', settings.GROQ_API_KEY),
            ('INDEED_API_KEY', settings.INDEED_API_KEY),
        ]
        
        for name, value in optional_settings:
            if value:
                print(f"✅ {name}: configured")
            else:
                print(f"⚠️  {name}: not configured (optional)")
        
        if missing_settings:
            print(f"\n❌ Missing required settings: {', '.join(missing_settings)}")
            print("Please update your .env file with the required values.")
            return False
        else:
            print("\n✅ All required settings are configured!")
            return True
            
    except Exception as e:
        print(f"❌ Error validating environment: {e}")
        return False

def show_environment_info():
    """Show current environment information"""

    try:
        import os
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        from app.core.config import settings
        
        print("📊 Current Environment Configuration:")
        print(f"   Environment: {settings.ENVIRONMENT}")
        print(f"   Debug Mode: {settings.DEBUG}")
        print(f"   Backend URL: {settings.BACKEND_URL}")
        print(f"   Database: {settings.MONGODB_DB_NAME}")
        print(f"   Upload Dir: {settings.UPLOAD_DIR}")
        print(f"   Max File Size: {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB")
        print(f"   Allowed Extensions: {settings.allowed_extensions_list}")
        print(f"   CORS Origins: {settings.cors_origins_list}")
        
        # Show integration status
        print("\n🔗 Integration Status:")
        integrations = [
            ("LinkedIn", bool(settings.LINKEDIN_CLIENT_ID)),
            ("GROQ AI", bool(settings.GROQ_API_KEY)),
            ("Indeed", bool(settings.INDEED_API_KEY)),
            ("Glassdoor", bool(settings.GLASSDOOR_API_KEY)),
            ("ZipRecruiter", bool(settings.ZIPRECRUITER_API_KEY)),
        ]
        
        for name, configured in integrations:
            status = "✅ Configured" if configured else "❌ Not configured"
            print(f"   {name}: {status}")
            
    except Exception as e:
        print(f"❌ Error showing environment info: {e}")

def main():
    """Main setup function"""
    
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "validate":
            validate_environment()
        elif command == "info":
            show_environment_info()
        elif command == "setup":
            setup_environment()
        else:
            print("Usage: python setup_env.py [setup|validate|info]")
    else:
        # Default: run setup
        setup_environment()

if __name__ == "__main__":
    main()
