#!/usr/bin/env python3
"""
Debug experience data in database
"""

import sys
import asyncio
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

async def debug_experience_data():
    """Debug experience data in database"""
    try:
        from app.models.resume_processing import ResumeMetadata, ResumeDetails
        from beanie import init_beanie
        from motor.motor_asyncio import AsyncIOMotorClient
        from app.core.config import settings
        
        # Initialize database connection
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = client[settings.MONGODB_DB_NAME]
        
        await init_beanie(
            database=database,
            document_models=[ResumeMetadata, ResumeDetails]
        )
        
        print("🔍 Debugging Experience Data in Database")
        print("=" * 50)
        
        # Get all resume details
        details_list = await ResumeDetails.find_all().to_list()
        
        print(f"📊 Found {len(details_list)} resume details in database")
        
        for i, details in enumerate(details_list, 1):
            # Get resume metadata for filename
            meta = await ResumeMetadata.find_one({"_id": details.resume_id})
            filename = meta.filename if meta else "Unknown"
            
            print(f"\n📄 Resume {i}: {filename}")
            
            if details.parsed_data:
                pd = details.parsed_data
                
                # Check experience data
                experience = pd.get("experience", [])
                print(f"   💼 Experience in DB: {len(experience)} entries")
                
                if experience and isinstance(experience, list):
                    for j, exp in enumerate(experience[:2], 1):
                        if isinstance(exp, dict):
                            title = exp.get("title", "Unknown")
                            company = exp.get("company", "Unknown")
                            duration = exp.get("duration", "Unknown")
                            print(f"      {j}. {title} at {company} ({duration})")
                else:
                    print(f"      ⚠️ Experience data type: {type(experience)}")
                    print(f"      ⚠️ Experience content: {experience}")
                
                # Check projects data
                projects = pd.get("projects", [])
                print(f"   🚀 Projects in DB: {len(projects)} entries")
                
                if projects and isinstance(projects, list):
                    for j, proj in enumerate(projects[:2], 1):
                        if isinstance(proj, dict):
                            name = proj.get("name", "Unknown")
                            print(f"      {j}. {name}")
                
                # Check total experience years
                total_exp = pd.get("total_experience_years", 0)
                print(f"   📅 Total Experience Years in DB: {total_exp}")
                
                # Show all keys in parsed_data
                print(f"   🔑 All keys in parsed_data: {list(pd.keys())}")
            else:
                print("   ⚠️ No parsed_data found")
        
        await client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """Main function"""
    await debug_experience_data()

if __name__ == "__main__":
    asyncio.run(main())
