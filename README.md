# Resume Screener - AI-Powered Hiring Tool

An industrial-grade AI-powered resume screening application for HR teams and hiring managers.

## 🎯 Features

- **Multi-Resume Upload**: Support for individual files and zip archives
- **Job Description Matching**: Upload or paste job descriptions for comparison
- **AI-Powered Analysis**: Extract key data and generate match scores using GROQ
- **Smart Summaries**: AI-generated explanations for fit/rejection decisions
- **Data Management**: Store and manage all results in MongoDB
- **Export Capabilities**: Export results to PDF/CSV formats

## 🧰 Tech Stack

- **Frontend**: Next.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **AI**: GROQ API
- **Database**: MongoDB
- **Resume Parser**: pdfplumber + GROQ

## 📁 Project Structure

```
resume-screener/
├── frontend/                 # Next.js frontend application
├── backend/                  # FastAPI backend application
├── shared/                   # Shared types and utilities
├── docker-compose.yml        # Development environment
├── .env.example             # Environment variables template
└── README.md                # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB
- Docker & Docker Compose (recommended)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resume-screener
   ```

2. **Set up environment variables**
   ```bash
   cp .env.docker .env
   # Edit .env with your GROQ API key and other settings
   ```

3. **Start all services**
   ```bash
   make up
   # or
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Installation

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

3. **Start Services**
   ```bash
   # Terminal 1: Backend
   cd backend && source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

## 🔧 Development

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

### Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: mongodb://localhost:27017

## 📝 License

MIT License
