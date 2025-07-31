"""
Comprehensive test runner for Resume Screener Backend
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

async def test_imports():
    """Test all critical imports"""
    print("🧪 Testing Critical Imports...")
    
    try:
        # Core imports
        # API imports
        from app.api.endpoints import analytics, auth, candidates, jobs, users
        from app.core.security import create_access_token, verify_password
        from app.models.analytics import AnalyticsEvent, DailyMetrics
        from app.models.candidate import (Candidate, CandidateCreate,
                                          CandidateResponse)
        from app.models.job import Job, JobCreate, JobResponse
        from app.models.user import User, UserCreate, UserResponse
        from app.services.ai_analyzer import AIAnalyzer
        from app.services.analytics_service import AnalyticsService
        from app.services.candidate_service import CandidateService
        from app.services.groq_ai_service import GroqAIService
        from app.services.job_service import JobService
        from app.services.resume_parser import ResumeParser
        # Service imports
        from app.services.user_service import UserService
        
        print("✅ All critical imports successful")
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

async def test_models():
    """Test model validation"""
    print("\n🧪 Testing Model Validation...")
    
    try:
        from app.models.candidate import CandidateCreate
        from app.models.job import JobCreate
        from app.models.user import UserCreate

        # Test user model
        user_data = UserCreate(
            email="test@example.com",
            password="testpassword123",
            full_name="Test User"
        )
        
        # Test job model
        job_data = JobCreate(
            title="Software Engineer",
            description="Great opportunity",
            location="Remote"
        )
        
        # Test candidate model
        candidate_data = CandidateCreate(
            first_name="John",
            last_name="Doe"
        )
        
        print("✅ Model validation successful")
        return True
        
    except Exception as e:
        print(f"❌ Model validation error: {e}")
        return False

async def test_services():
    """Test service instantiation"""
    print("\n🧪 Testing Service Instantiation...")
    
    try:
        from app.services.ai_analyzer import AIAnalyzer
        from app.services.analytics_service import AnalyticsService
        from app.services.candidate_service import CandidateService
        from app.services.groq_ai_service import GroqAIService
        from app.services.job_service import JobService
        from app.services.resume_parser import ResumeParser
        from app.services.user_service import UserService

        # Instantiate services
        user_service = UserService()
        job_service = JobService()
        candidate_service = CandidateService()
        analytics_service = AnalyticsService()
        resume_parser = ResumeParser()
        groq_service = GroqAIService()
        ai_analyzer = AIAnalyzer()
        
        print("✅ Service instantiation successful")
        return True
        
    except Exception as e:
        print(f"❌ Service instantiation error: {e}")
        return False

async def test_security():
    """Test security functions"""
    print("\n🧪 Testing Security Functions...")
    
    try:
        from app.core.security import (create_access_token, get_password_hash,
                                       verify_password, verify_token)

        # Test password hashing
        password = "testpassword123"
        hashed = get_password_hash(password)
        verified = verify_password(password, hashed)
        
        if not verified:
            raise Exception("Password verification failed")
        
        # Test token creation
        token = create_access_token({"sub": "user123"})
        user_id = verify_token(token)
        
        if user_id != "user123":
            raise Exception("Token verification failed")
        
        print("✅ Security functions working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Security test error: {e}")
        return False

async def test_resume_parser():
    """Test resume parser"""
    print("\n🧪 Testing Resume Parser...")
    
    try:
        from app.services.resume_parser import ResumeParser
        
        parser = ResumeParser()
        
        # Create sample resume
        sample_text = """
        John Doe
        Software Engineer
        john.doe@email.com
        (555) 123-4567
        
        SKILLS
        Python, JavaScript, React, Django
        
        EXPERIENCE
        Senior Developer - Tech Corp
        """
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as tmp_file:
            tmp_file.write(sample_text)
            tmp_file_path = tmp_file.name
        
        try:
            parsed_data = await parser.parse_resume(tmp_file_path)
            
            if not parsed_data.get('contact_info'):
                raise Exception("Contact info not parsed")
            
            if not parsed_data.get('skills'):
                raise Exception("Skills not parsed")
            
            print("✅ Resume parser working correctly")
            return True
            
        finally:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
        
    except Exception as e:
        print(f"❌ Resume parser test error: {e}")
        return False

async def test_ai_services():
    """Test AI services"""
    print("\n🧪 Testing AI Services...")
    
    try:
        from app.services.ai_analyzer import AIAnalyzer
        from app.services.groq_ai_service import GroqAIService
        
        groq_service = GroqAIService()
        ai_analyzer = AIAnalyzer()
        
        # Test with sample data
        sample_data = {
            'skills': ['Python', 'JavaScript'],
            'experience': [{'title': 'Developer'}],
            'education': [{'degree': 'Bachelor'}]
        }
        
        # Test resume analysis (will use mock)
        analysis = await groq_service.analyze_resume("Sample text", sample_data)
        
        if not analysis.get('strengths'):
            raise Exception("AI analysis failed")
        
        # Test job matching (will use mock)
        match_score = await groq_service.calculate_job_match_score(
            "Sample resume", "Job description", sample_data, ["Python"]
        )
        
        if not match_score.get('overall_score'):
            raise Exception("Job matching failed")
        
        print("✅ AI services working correctly")
        return True
        
    except Exception as e:
        print(f"❌ AI services test error: {e}")
        return False

async def test_api_structure():
    """Test API structure"""
    print("\n🧪 Testing API Structure...")
    
    try:
        from app.api.api import api_router
        from app.main import app

        # Check if routes are registered
        routes = api_router.routes
        
        if len(routes) == 0:
            raise Exception("No routes registered")
        
        print(f"✅ API structure working correctly ({len(routes)} routes)")
        return True
        
    except Exception as e:
        print(f"❌ API structure test error: {e}")
        return False

async def run_all_tests():
    """Run all tests"""
    print("🚀 Starting Comprehensive Backend Tests...\n")
    
    tests = [
        ("Imports", test_imports),
        ("Models", test_models),
        ("Services", test_services),
        ("Security", test_security),
        ("Resume Parser", test_resume_parser),
        ("AI Services", test_ai_services),
        ("API Structure", test_api_structure)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:20} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is ready for development.")
    else:
        print("⚠️ Some tests failed. Please check the issues above.")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(run_all_tests())
