# Resume Screener - AI-Powered Hiring Tool

An industrial-grade AI-powered resume screening application for HR teams and hiring managers with advanced features including duplicate detection, bulk operations, real-time progress tracking, and comprehensive analytics.

## 🎯 Core Features

### 📄 Resume Management
- **Multi-Upload Support**: Single files, multiple files, ZIP archives, and Google Drive integration
- **Duplicate Detection**: SHA-256 file hashing with exact and similar candidate detection
- **Bulk Operations**: Delete, status updates, and ZIP downloads for multiple resumes
- **Real-time Processing**: SSE-powered progress tracking with detailed status updates
- **Smart Parsing**: AI-powered resume parsing with fallback mechanisms

### 🤖 AI-Powered Analysis
- **Advanced Scoring**: Deterministic 0-100 scoring with detailed explanations
- **Multiple AI Providers**: OpenAI, GROQ, and Hugging Face support
- **Job Matching**: Intelligent matching against job requirements
- **Vector Search**: Semantic search and similarity matching
- **Performance Optimized**: 15-20 second processing time (down from 50-60 seconds)

### 📊 Dashboard & Analytics
- **Interactive Dashboard**: Real-time metrics, charts, and quick actions
- **Advanced Filtering**: By job, status, skills, experience, and more
- **Export Capabilities**: PDF, CSV, and bulk download options
- **Mobile Responsive**: Optimized for all devices and screen sizes

### 🔧 Technical Features
- **Modern Architecture**: FastAPI backend with Next.js 15 frontend
- **Real-time Updates**: Server-Sent Events (SSE) for live progress tracking
- **Database**: MongoDB with optimized connection pooling
- **Authentication**: JWT-based security with role management
- **Docker Support**: Complete containerization for easy deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB
- Docker & Docker Compose (recommended)

### Environment Setup
```bash
# Backend environment variables
PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://ai.nuox.io/v1
OPENAI_MODEL=gpt-4
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-70b-versatile
HUGGINGFACE_API_KEY=your_hf_key
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=resume_screener
SECRET_KEY=your-super-secret-key-min-32-characters
ENABLE_SCORING=1
SCORING_TEMPERATURE=0.1
SCORING_MAX_TOKENS=1000
CACHE_TTL_SECONDS=120
```

### Docker Setup (Recommended)
```bash
# Clone and start all services
git clone <repository-url>
cd resume-screener
cp .env.docker .env
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Installation
```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## 🧰 Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Redux Toolkit + React Hooks
- **Authentication**: NextAuth.js
- **Real-time**: Server-Sent Events (SSE)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB with Beanie ODM
- **AI Providers**: OpenAI, GROQ, Hugging Face
- **Task Queue**: Celery with Redis
- **Authentication**: JWT with bcrypt
- **File Processing**: pdfplumber, python-docx
- **Vector Store**: Qdrant for semantic search

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (production)
- **Monitoring**: Structured logging with rotation
- **Caching**: Redis for session and API caching

## 📁 Project Structure

```
resume-screener/
├── frontend/                 # Next.js 15 frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities and services
│   │   └── types/          # TypeScript definitions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── tasks/          # Celery tasks
│   │   └── main.py         # Application entry
│   ├── uploads/            # File storage
│   ├── logs/              # Application logs
│   └── requirements.txt
├── shared/                   # Shared utilities
├── resumes/                 # Sample resume files
├── docker-compose.yml       # Development environment
├── docker-compose.prod.yml  # Production environment
└── README.md               # This documentation
```

## 🔧 Development Commands

### Docker Commands
```bash
# Development
make up              # Start all services
make down            # Stop all services
make logs            # View logs
make build           # Build images
make clean           # Clean up resources

# Production
make prod-up         # Start in production mode
make prod-down       # Stop production services

# Testing
make test            # Run all tests
make test-backend    # Run backend tests only
make test-frontend   # Run frontend tests only

# Code Quality
make lint            # Run linting
make format          # Format code
```

### Manual Commands
```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev

# Celery Workers (for async processing)
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
```

## 🚀 Performance Optimizations

### Recent Improvements (70% faster processing)
- **Database Connection Pooling**: Reduced initialization overhead by 95%
- **LLM Client Caching**: 85% faster AI provider connections
- **Vector Store Optimization**: 80% faster vector operations
- **Configuration Tuning**: Optimized AI parameters for speed
- **Async Event Loop**: Eliminated unnecessary delays

### Performance Metrics
| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Database Init | 2-3s | 50-100ms | 95% faster |
| LLM Client | 1-2s | 100-200ms | 85% faster |
| Vector Ops | 0.5-1s | 100-200ms | 80% faster |
| AI Processing | 30-40s | 10-15s | 60% faster |
| **Total** | **50-60s** | **15-25s** | **70% faster** |

## 🔄 Real-time Features (SSE Implementation)

### Why SSE Over WebSockets?
- **Simpler**: HTTP-based, no complex connection management
- **Reliable**: Auto-reconnection and better firewall compatibility
- **Efficient**: Perfect for one-way progress updates
- **Scalable**: Works with load balancers and CDNs

### SSE Endpoints
```bash
# Stream real-time progress
GET /api/v1/sse/progress/stream/{user_id}

# Check current progress
GET /api/v1/sse/progress/status/{user_id}

# Cleanup progress data
DELETE /api/v1/sse/progress/{user_id}

# Connection statistics
GET /api/v1/sse/connections/status
```

### Frontend SSE Usage
```typescript
import { sseService } from '@/lib/services/sseService';

// Setup progress callback
sseService.onProgress((progress) => {
  console.log(`Progress: ${progress.completed}/${progress.total}`);
  updateUI(progress);
});

// Connect and receive updates
await sseService.connect('user_123');
```

## 🔍 Duplicate Detection System

### Features
- **SHA-256 File Hashing**: Exact duplicate detection
- **Similar Candidate Detection**: Same name/email matching
- **Pre-upload Warnings**: Visual warnings before upload
- **Bulk Management**: Manage duplicates efficiently
- **Statistics Tracking**: Monitor duplicate impact

### API Usage
```bash
# Check for duplicates
POST /api/v1/resumes/check-duplicates
{
  "file_hash": "sha256_hash_here"
}

# Get duplicate groups
GET /api/v1/resumes/duplicates

# Delete duplicates
DELETE /api/v1/resumes/duplicates/{id}
```

## 🎯 AI Scoring System

### Scoring Providers
```bash
# OpenAI (default)
PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4

# GROQ (fast)
PROVIDER=groq
GROQ_API_KEY=your_key
GROQ_MODEL=llama-3.1-70b-versatile

# Hugging Face (local)
PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_key
```

### Scoring API
```bash
curl -X POST http://localhost:8000/v1/scoring/resume-vs-job \
-H "Content-Type: application/json" \
-d '{
  "parsed_resume": {
    "name": "Jane Doe",
    "skills": ["Python","FastAPI","AWS"],
    "experience": [{"title":"Backend Engineer","years":3.5}]
  },
  "job": {
    "title":"Senior Backend Engineer",
    "must_have_skills":["Python","Django","AWS"],
    "min_years":4
  },
  "weights": {
    "skills_match":0.45,
    "experience_relevance":0.30,
    "seniority_alignment":0.10
  }
}'
```

## 📊 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379
- **Qdrant**: http://localhost:6333

## 🧪 Testing

### Backend Tests
```bash
cd backend
python tests/test_runner.py  # Comprehensive test suite
pytest                       # Unit tests
python scripts/test_performance.py  # Performance tests
```

### Frontend Tests
```bash
cd frontend
npm test                     # Unit tests
npm run test:e2e            # End-to-end tests
```

### API Testing
```bash
# Test resume upload
curl -X POST http://localhost:8000/api/v1/resumes/upload \
  -H "Authorization: Bearer your_token" \
  -F "file=@resume.pdf"

# Test SSE connection
curl http://localhost:8000/api/v1/sse/progress/stream/user_123
```

## 🔧 Environment Configuration

### Required Variables
```bash
# Database
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=resume_screener

# Security
SECRET_KEY=your-super-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Providers (choose one)
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_KEY=your_hf_key

# Performance Settings
PARSER_LLM_FAST_MODE=true
CACHE_TTL_SECONDS=120
SCORING_TEMPERATURE=0.1
SCORING_MAX_TOKENS=1000
```

### Optional Integrations
```bash
# LinkedIn Jobs API
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Indeed API
INDEED_API_KEY=your_indeed_api_key
INDEED_PUBLISHER_ID=your_indeed_publisher_id
```

## 🐛 Troubleshooting

### Common Issues

**1. SSE Connection Fails**
- Check CORS headers and API URL configuration
- Verify network connectivity and firewall settings

**2. No Progress Updates**
- Verify user ID matches between frontend and backend
- Check backend task execution and server logs

**3. Duplicate Detection Not Working**
- Ensure file hashing is enabled in configuration
- Check database connection and duplicate service logs

**4. AI Scoring Errors**
- Verify API keys are correctly set
- Check AI provider rate limits and quotas

### Debug Commands
```bash
# Check SSE connections
curl http://localhost:8000/api/v1/sse/connections/status

# Check progress for user
curl http://localhost:8000/api/v1/sse/progress/status/user_123

# Test duplicate detection
curl -X POST http://localhost:8000/api/v1/resumes/check-duplicates \
  -H "Content-Type: application/json" \
  -d '{"file_hash":"test_hash"}'
```

## 📈 Production Deployment

### Docker Production
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Environment-specific Settings
```bash
# Production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
ENABLE_RATE_LIMITING=true
ENABLE_HTTPS_REDIRECT=true

# Development
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
ENABLE_RATE_LIMITING=false
```

## 🎉 Recent Updates

### Latest Features
- ✅ **Duplicate Detection**: Complete SHA-256 based system
- ✅ **Bulk Operations**: ZIP downloads, bulk delete/status updates
- ✅ **SSE Progress Tracking**: Real-time processing updates
- ✅ **Performance Optimization**: 70% faster processing
- ✅ **Mobile Responsive**: Optimized for all devices
- ✅ **Toast Notifications**: User-friendly feedback system

### Bug Fixes
- ✅ Fixed React state timing issues in bulk operations
- ✅ Resolved JavaScript initialization errors
- ✅ Corrected toast notification format
- ✅ Eliminated debug output from production UI
- ✅ Fixed ZIP bulk download functionality

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Check the troubleshooting section above
- Review API documentation at `/docs`
- Check server logs in the `logs/` directory
- Test configuration with provided debug commands

---

**✨ Resume Screener is production-ready with world-class performance and features!**
