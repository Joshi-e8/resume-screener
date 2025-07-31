# 🔧 Environment Setup Guide

## Overview

The Resume Screener Backend uses environment variables for configuration to ensure security and flexibility across different deployment environments.

## Quick Setup

### 1. **Automatic Setup (Recommended)**
```bash
# Run the setup script
python scripts/setup_env.py setup

# Validate configuration
python scripts/setup_env.py validate

# View current configuration
python scripts/setup_env.py info
```

### 2. **Manual Setup**
```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

## Environment Files

### `.env` - Main Configuration
Contains all environment variables for the application.

### `.env.example` - Template
Template file with all available configuration options and examples.

### `.gitignore`
Ensures `.env` files are not committed to version control for security.

## Required Configuration

### **Database (Required)**
```bash
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=resume_screener_dev
```

### **Security (Required)**
```bash
SECRET_KEY=your-super-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### **Server (Required)**
```bash
BACKEND_HOST=localhost
BACKEND_PORT=8000
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Optional Integrations

### **LinkedIn Jobs API**
```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8000/api/v1/linkedin/auth/callback
```

**Setup Steps:**
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create a new app
3. Add redirect URI: `http://localhost:8000/api/v1/linkedin/auth/callback`
4. Copy Client ID and Client Secret to `.env`

### **GROQ AI (for Resume Analysis)**
```bash
GROQ_API_KEY=your_groq_api_key
```

**Setup Steps:**
1. Sign up at [GROQ](https://groq.com/)
2. Generate API key
3. Add to `.env` file

### **Indeed API**
```bash
INDEED_API_KEY=your_indeed_api_key
INDEED_PUBLISHER_ID=your_indeed_publisher_id
```

### **Other Job Boards**
```bash
# Glassdoor
GLASSDOOR_API_KEY=your_glassdoor_api_key
GLASSDOOR_PARTNER_ID=your_glassdoor_partner_id

# ZipRecruiter
ZIPRECRUITER_API_KEY=your_ziprecruiter_api_key
ZIPRECRUITER_ACCOUNT_ID=your_ziprecruiter_account_id
```

## Development vs Production

### **Development (.env)**
```bash
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
ENABLE_RATE_LIMITING=false
```

### **Production (.env.production)**
```bash
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
ENABLE_RATE_LIMITING=true
ENABLE_HTTPS_REDIRECT=true
SECRET_KEY=super-secure-production-key
MONGODB_URL=mongodb://prod-server:27017
BACKEND_URL=https://api.yourdomain.com
```

## Configuration Validation

### **Check Configuration**
```bash
# Validate all settings
python scripts/setup_env.py validate

# View current configuration
python scripts/setup_env.py info
```

### **Test Application**
```bash
# Run comprehensive tests
python tests/test_runner.py

# Test specific service
python -c "from app.services.linkedin_service import LinkedInService; print('✅ LinkedIn service working!')"
```

## Security Best Practices

### **1. Secret Key Generation**
```bash
# Generate secure secret key
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### **2. Environment File Security**
- ✅ Never commit `.env` files to version control
- ✅ Use different `.env` files for different environments
- ✅ Rotate API keys regularly
- ✅ Use environment-specific database names

### **3. Production Deployment**
```bash
# Use environment variables instead of .env files
export SECRET_KEY="your-production-secret"
export MONGODB_URL="mongodb://prod-server:27017"
export LINKEDIN_CLIENT_ID="prod-linkedin-id"
```

## Troubleshooting

### **Common Issues**

#### **1. Import Errors**
```bash
# Ensure you're in the backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Run with proper Python path
PYTHONPATH=. python scripts/setup_env.py validate
```

#### **2. Database Connection**
```bash
# Test MongoDB connection
python -c "
from app.core.config import settings
print(f'Database URL: {settings.MONGODB_URL}')
print(f'Database Name: {settings.MONGODB_DB_NAME}')
"
```

#### **3. LinkedIn Integration**
```bash
# Check LinkedIn configuration
python -c "
from app.core.config import settings
print(f'Client ID: {\"✅ Set\" if settings.LINKEDIN_CLIENT_ID else \"❌ Missing\"}')
print(f'Client Secret: {\"✅ Set\" if settings.LINKEDIN_CLIENT_SECRET else \"❌ Missing\"}')
print(f'Redirect URI: {settings.LINKEDIN_REDIRECT_URI}')
"
```

### **Environment Variables Not Loading**

1. **Check file location**: `.env` should be in the `backend/` directory
2. **Check file encoding**: Use UTF-8 encoding
3. **Check syntax**: No spaces around `=` in `.env` files
4. **Restart application**: Changes require restart

### **API Keys Not Working**

1. **Verify API key format**: Check for extra spaces or characters
2. **Check API key permissions**: Ensure proper scopes are enabled
3. **Test API key separately**: Use curl or Postman to test
4. **Check rate limits**: Some APIs have usage limits

## Directory Structure

```
backend/
├── .env                    # Main environment file (not in git)
├── .env.example           # Template file (in git)
├── .gitignore            # Excludes .env files
├── scripts/
│   └── setup_env.py      # Environment setup script
├── uploads/              # File upload directory
├── logs/                 # Application logs
├── temp/                 # Temporary files
└── app/
    └── core/
        └── config.py     # Configuration settings
```

## Support

If you encounter issues:

1. **Run validation**: `python scripts/setup_env.py validate`
2. **Check logs**: Look in `logs/` directory
3. **Test configuration**: `python scripts/setup_env.py info`
4. **Verify API keys**: Test each integration separately

## Next Steps

After environment setup:

1. **Start the application**: `uvicorn app.main:app --reload`
2. **Test API endpoints**: Visit `http://localhost:8000/docs`
3. **Set up frontend**: Configure frontend to use `BACKEND_URL`
4. **Configure integrations**: Add API keys for LinkedIn, GROQ, etc.

---

**✅ Environment setup complete! Your backend is ready for development.**
