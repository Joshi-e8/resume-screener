#!/bin/bash

# Resume Screener Setup Script
echo "🚀 Setting up Resume Screener Application..."

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is not installed. Please install Python 3.9+"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "⚠️  Docker is not installed. You can still run without Docker."
    fi
    
    echo "✅ Requirements check completed"
}

# Setup environment variables
setup_env() {
    echo "🔧 Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📝 Created .env file from template"
        echo "⚠️  Please update .env file with your GROQ API key and other settings"
    else
        echo "✅ .env file already exists"
    fi
}

# Setup backend
setup_backend() {
    echo "🐍 Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ Created Python virtual environment"
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt
    echo "✅ Installed Python dependencies"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    echo "⚛️  Setting up frontend..."
    
    cd frontend
    
    # Dependencies are already installed during create-next-app
    echo "✅ Frontend dependencies already installed"
    
    cd ..
}

# Create uploads directory
setup_directories() {
    echo "📁 Creating necessary directories..."
    
    mkdir -p backend/uploads
    mkdir -p backend/exports
    
    echo "✅ Directories created"
}

# Main setup function
main() {
    check_requirements
    setup_env
    setup_directories
    setup_backend
    setup_frontend
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env file with your GROQ API key"
    echo "2. Start MongoDB (or use Docker Compose)"
    echo "3. Run the development servers:"
    echo ""
    echo "   Backend:"
    echo "   cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
    echo ""
    echo "   Frontend:"
    echo "   cd frontend && npm run dev"
    echo ""
    echo "   Or use Docker Compose:"
    echo "   docker-compose up -d"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
}

# Run main function
main
