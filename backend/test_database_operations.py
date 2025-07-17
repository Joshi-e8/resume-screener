#!/usr/bin/env python3
"""
Test database operations
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from app.core.database import init_database
from app.models.resume import JobDescription, UploadedResume


async def test_database_operations():
    """Test basic database operations"""
    try:
        print("🔄 Initializing database...")
        await init_database()
        print("✅ Database initialized successfully")
        
        # Test creating a job description
        print("🔄 Creating test job description...")
        job = JobDescription(
            title="Senior Python Developer",
            company="Tech Corp",
            description="We are looking for a senior Python developer...",
            requirements=["Python", "FastAPI", "MongoDB"],
            preferred_skills=["Docker", "AWS", "React"],
            experience_level="Senior",
            location="Remote"
        )
        
        saved_job = await job.insert()
        print(f"✅ Job description created with ID: {saved_job.id}")
        
        # Test creating an uploaded resume
        print("🔄 Creating test resume record...")
        resume = UploadedResume(
            filename="test_resume.pdf",
            original_name="John_Doe_Resume.pdf",
            file_path="/uploads/test_resume.pdf",
            file_size=1024000,
            mime_type="application/pdf",
            status="UPLOADED"
        )
        
        saved_resume = await resume.insert()
        print(f"✅ Resume record created with ID: {saved_resume.id}")
        
        # Test querying
        print("🔄 Testing database queries...")
        all_jobs = await JobDescription.find_all().to_list()
        all_resumes = await UploadedResume.find_all().to_list()
        
        print(f"✅ Found {len(all_jobs)} job descriptions")
        print(f"✅ Found {len(all_resumes)} resume records")
        
        # Clean up test data
        print("🔄 Cleaning up test data...")
        await saved_job.delete()
        await saved_resume.delete()
        print("✅ Test data cleaned up")
        
        print("\n🎉 All database operations completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database operations failed: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_database_operations())
    sys.exit(0 if success else 1)
