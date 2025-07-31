"""
Database configuration and connection
"""

import logging

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.models.analytics import (AnalyticsEvent, DailyMetrics,
                                  PlatformMetrics, UserUsageStats)
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.resume import JobDescription, ResumeAnalysis, UploadedResume
from app.models.user import User

logger = logging.getLogger(__name__)

# Global database client
client: AsyncIOMotorClient = None


async def get_database():
    """Get database instance"""
    return client[settings.MONGODB_DB_NAME]


async def connect_to_mongo():
    """Create database connection"""
    global client
    try:
        logger.info(f"Connecting to MongoDB at: {settings.MONGODB_URL}")
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=5000,
            socketTimeoutMS=5000
        )

        # Test connection
        await client.admin.command('ping')
        logger.info("✅ Connected to MongoDB successfully")

        # List databases to verify connection
        db_list = await client.list_database_names()
        logger.info(f"Available databases: {db_list}")

    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        logger.error(f"Connection URL: {settings.MONGODB_URL}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info("Disconnected from MongoDB")


async def init_database():
    """Initialize database and models"""
    try:
        await connect_to_mongo()

        # Initialize Beanie with document models
        await init_beanie(
            database=client[settings.MONGODB_DB_NAME],
            document_models=[
                # Core models
                User,
                Job,
                Candidate,
                # Resume models
                UploadedResume,
                JobDescription,
                ResumeAnalysis,
                # Analytics models
                AnalyticsEvent,
                DailyMetrics,
                PlatformMetrics,
                UserUsageStats
            ]
        )

        logger.info("✅ Database initialized successfully")
        logger.info(f"Using database: {settings.MONGODB_DB_NAME}")

    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise
