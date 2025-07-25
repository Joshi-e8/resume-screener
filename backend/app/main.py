"""
Resume Screener FastAPI Application
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import init_database, close_mongo_connection
from app.api.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    try:
        await init_database()
        print("✅ Application startup completed successfully")
    except Exception as e:
        print(f"❌ Application startup failed: {e}")
        raise

    yield

    # Shutdown
    try:
        await close_mongo_connection()
        print("✅ Application shutdown completed successfully")
    except Exception as e:
        print(f"❌ Application shutdown failed: {e}")

# Create FastAPI app
app = FastAPI(
    title="Resume Screener API",
    description="AI-powered resume screening and analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],  # Convert string to list
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API router
app.include_router(api_router, prefix="/api/v1")



@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Resume Screener API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "api": "operational"
    }
