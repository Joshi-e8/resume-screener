"""
Resume Screener FastAPI Application
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.api import api_router
from app.core.config import settings
from app.core.database import close_mongo_connection, init_database
from app.core.json_logging import setup_json_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    from app.core.json_logging import json_log

    # Startup
    try:
        await init_database()
        json_log("Application startup completed successfully",
                level="INFO", event_type="application_lifecycle", event="startup_success")
    except Exception as e:
        json_log("Application startup failed",
                level="ERROR", event_type="application_lifecycle", event="startup_failed",
                error=str(e))
        raise

    yield

    # Shutdown
    try:
        await close_mongo_connection()
        json_log("Application shutdown completed successfully",
                level="INFO", event_type="application_lifecycle", event="shutdown_success")
    except Exception as e:
        json_log("Application shutdown failed",
                level="ERROR", event_type="application_lifecycle", event="shutdown_failed",
                error=str(e))


# Create FastAPI app
app = FastAPI(
    title="Resume Screener API",
    description="AI-powered resume screening and analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

print(settings.CORS_ORIGINS)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
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

# Include new scoring routes (additive, versioned separately)
from app.api.routes import scoring as scoring
app.include_router(scoring.router)

# Health routes (LLM diagnostics)
from app.api.routes import health as health
app.include_router(health.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Resume Screener API", "version": "1.0.0", "status": "healthy"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {"status": "healthy", "database": "connected", "api": "operational"}
