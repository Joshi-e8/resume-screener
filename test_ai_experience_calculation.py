#!/usr/bin/env python3
"""
Test AI-based experience calculation
"""

import sys
import asyncio
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

async def regenerate_ai_scoring_with_experience():
    """Regenerate AI scoring with experience calculation"""
    try:
        from app.models.resume_processing import ResumeMetadata, ResumeDetails
        from app.models.job import Job
        from app.scoring.service import score_resume_against_job
        from beanie import init_beanie
        from motor.motor_asyncio import AsyncIOMotorClient
        from app.core.config import settings
        
        # Initialize database connection
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = client[settings.MONGODB_DB_NAME]
        
        await init_beanie(
            database=database,
            document_models=[ResumeMetadata, ResumeDetails, Job]
        )
        
        print("🤖 Testing AI-Based Experience Calculation")
        print("=" * 50)
        
        # Clear scoring cache first
        from app.scoring.llm_client import clear_scoring_cache
        clear_scoring_cache()
        print("✅ Scoring cache cleared")
        
        # Get all resumes
        metas = await ResumeMetadata.find_all().to_list()
        
        # Get the job for scoring
        job = await Job.find_one({"title": {"$regex": "Python", "$options": "i"}})
        if not job:
            print("⚠️ No Python job found for scoring")
            return
        
        job_data = {
            "title": job.title,
            "description": job.description,
            "required_skills": job.requirements,  # Use 'requirements' field
            "nice_to_have": job.skills,  # Use 'skills' field
            "experience_level": job.experience_level
        }
        
        print(f"🎯 Using job: {job.title}")
        
        for i, meta in enumerate(metas, 1):
            print(f"\n📊 Processing Resume {i}: {meta.filename}")
            
            # Get detailed data
            details = await ResumeDetails.find_one({"resume_id": str(meta.id)})
            
            if details and details.parsed_data:
                try:
                    # Show experience data that AI will analyze
                    exp_array = details.parsed_data.get("experience", [])
                    print(f"   💼 Experience entries for AI: {len(exp_array)}")
                    for j, exp in enumerate(exp_array[:3], 1):
                        if isinstance(exp, dict):
                            title = exp.get("title", "Unknown")
                            company = exp.get("company", "Unknown")
                            duration = exp.get("duration", "Unknown")
                            print(f"      {j}. {title} at {company} ({duration})")
                    
                    # Generate new AI scoring with experience calculation
                    print(f"   🤖 Asking AI to calculate experience years...")
                    scoring_result = score_resume_against_job(
                        parsed_resume=details.parsed_data,
                        job=job_data
                    )
                    
                    # Check if AI calculated experience years
                    derived = scoring_result.get("derived", {})
                    ai_experience_years = derived.get("total_experience_years", 0)
                    
                    print(f"   ✅ AI calculated experience: {ai_experience_years} years")
                    
                    # Update analysis results
                    if not details.analysis_results:
                        details.analysis_results = {}
                    
                    details.analysis_results["ai_scoring"] = scoring_result
                    details.analysis_results["ai_overall_score"] = scoring_result.get("overall_score", 0)
                    
                    # Save updated details
                    await details.save()
                    
                    # Show new scoring
                    explanations = scoring_result.get("explanations", {})
                    top_matches = explanations.get("top_matches", [])
                    overall_score = scoring_result.get("overall_score", 0)
                    
                    print(f"   📈 New Overall Score: {overall_score}")
                    print(f"   🎯 New Top Matches: {top_matches[:3]}")
                    
                except Exception as e:
                    print(f"   ❌ Scoring failed: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                print("   ⚠️ No parsed data available")
        
        await client.close()
        
    except Exception as e:
        print(f"❌ Error regenerating scoring: {e}")
        import traceback
        traceback.print_exc()

async def test_api_with_ai_experience():
    """Test the API response with AI-calculated experience"""
    import requests
    import json
    
    try:
        print("\n🧪 Testing API with AI-Calculated Experience")
        print("=" * 50)
        
        url = "http://localhost:8000/api/v1/resumes"
        headers = {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGFjMzEzZWU3NmQ4ZDVkYzNmZjVhMDIiLCJleHAiOjE3NTYxMTg4ODMsInR5cGUiOiJhY2Nlc3MifQ.kaiExkw-nrZRWr1nv7IH1veM2ShfW7Q9RNdrY2hl98c"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('records', [])
            
            print(f"📊 Total resumes: {len(records)}")
            
            for i, record in enumerate(records, 1):
                name = record.get('candidate_name', f'Resume {i}')
                total_exp_years = record.get('total_experience_years', 0)
                experience_array = record.get('experience', [])
                
                print(f"\n📄 {name}:")
                print(f"   📅 AI-Calculated Experience Years: {total_exp_years}")
                print(f"   💼 Experience Entries: {len(experience_array)}")
                
                # Show experience timeline for verification
                if experience_array:
                    print(f"   🕒 Experience Timeline:")
                    for j, exp in enumerate(experience_array, 1):
                        if isinstance(exp, dict):
                            title = exp.get('title', 'Unknown')
                            duration = exp.get('duration', 'Unknown')
                            print(f"      {j}. {title} ({duration})")
                
                # Check AI scoring details
                ai_scoring = record.get('ai_scoring', {})
                if ai_scoring:
                    derived = ai_scoring.get('derived', {})
                    ai_exp_years = derived.get('total_experience_years', 'Not calculated')
                    print(f"   🤖 AI Derived Experience: {ai_exp_years} years")
            
            # Save response for analysis
            with open("ai_experience_response.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Response saved to: ai_experience_response.json")
            
        else:
            print(f"❌ API request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

async def main():
    """Main function"""
    print("🤖 AI-BASED EXPERIENCE CALCULATION TEST")
    print("=" * 60)
    
    # Step 1: Regenerate AI scoring with experience calculation
    await regenerate_ai_scoring_with_experience()
    
    # Step 2: Test API response
    await test_api_with_ai_experience()
    
    print(f"\n🎉 AI experience calculation test complete!")

if __name__ == "__main__":
    asyncio.run(main())
