"""
Database initialization script
Creates indexes, default data, and performs initial setup
"""

import asyncio
import os
import sys
from datetime import datetime

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import init_database
from app.core.security import get_password_hash
from app.models.analytics import UserUsageStats
from app.models.user import User


async def create_default_admin_user():
    """Create default admin user if it doesn't exist"""
    try:
        # Check if admin user already exists
        admin_user = await User.find_one(User.email == "admin@resumescreener.com")

        if not admin_user:
            # Create default admin user
            admin_user = User(
                email="admin@resumescreener.com",
                full_name="System Administrator",
                company_name="Resume Screener",
                hashed_password=get_password_hash("admin123!"),
                is_active=True,
                is_superuser=True,
                subscription_plan="enterprise",
                permissions=["all"],
                created_at=datetime.utcnow(),
            )

            await admin_user.insert()
            print("✅ Created default admin user: admin@resumescreener.com")
            print("   Password: admin123!")
            print("   ⚠️  Please change this password in production!")

            # Create usage stats for admin user
            usage_stats = UserUsageStats(
                user_id=str(admin_user.id),
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow().replace(
                    month=datetime.utcnow().month + 1
                ),
                resumes_limit=None,  # Unlimited for admin
                jobs_limit=None,
                api_calls_limit=None,
            )
            await usage_stats.insert()

        else:
            print("ℹ️  Admin user already exists")

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")


async def create_demo_user():
    """Create demo user for testing"""
    try:
        # Check if demo user already exists
        demo_user = await User.find_one(User.email == "demo@resumescreener.com")

        if not demo_user:
            # Create demo user
            demo_user = User(
                email="demo@resumescreener.com",
                full_name="Demo User",
                company_name="Demo Company",
                hashed_password=get_password_hash("demo123!"),
                is_active=True,
                is_superuser=False,
                subscription_plan="premium",
                job_title="HR Manager",
                department="Human Resources",
                created_at=datetime.utcnow(),
            )

            await demo_user.insert()
            print("✅ Created demo user: demo@resumescreener.com")
            print("   Password: demo123!")

            # Create usage stats for demo user
            usage_stats = UserUsageStats(
                user_id=str(demo_user.id),
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow().replace(
                    month=datetime.utcnow().month + 1
                ),
                resumes_limit=1000,
                jobs_limit=50,
                api_calls_limit=10000,
            )
            await usage_stats.insert()

        else:
            print("ℹ️  Demo user already exists")

    except Exception as e:
        print(f"❌ Error creating demo user: {e}")


async def verify_indexes():
    """Verify that all indexes are created properly"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB_NAME]

        collections = await db.list_collection_names()
        print(f"📋 Collections created: {collections}")

        # Check indexes for each collection
        for collection_name in collections:
            collection = db[collection_name]
            indexes = await collection.list_indexes().to_list(length=None)
            print(f"   {collection_name}: {len(indexes)} indexes")

        client.close()
        print("✅ Index verification completed")

    except Exception as e:
        print(f"❌ Error verifying indexes: {e}")


async def main():
    """Main initialization function"""
    print("🚀 Starting database initialization...")
    print(f"📍 Database: {settings.MONGODB_DB_NAME}")
    print(f"🔗 MongoDB URL: {settings.MONGODB_URL}")

    try:
        # Initialize database and models
        await init_database()
        print("✅ Database connection established")

        # Create default users
        await create_default_admin_user()
        await create_demo_user()

        # Verify indexes
        await verify_indexes()

        print("\n🎉 Database initialization completed successfully!")
        print("\n📝 Default Users Created:")
        print("   Admin: admin@resumescreener.com / admin123!")
        print("   Demo:  demo@resumescreener.com / demo123!")
        print("\n⚠️  Remember to change default passwords in production!")

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
