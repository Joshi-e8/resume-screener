#!/usr/bin/env python3
"""
Live integration testing script for Resume Screener Backend
Tests all integrations with the running server
"""

import asyncio
import httpx
import json
import tempfile
import os
from datetime import datetime

BASE_URL = "http://localhost:8000"

class IntegrationTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        
    async def test_server_health(self):
        """Test if server is running and healthy"""
        print("🏥 Testing Server Health...")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Server healthy: {data['message']}")
                    print(f"   Version: {data['version']}")
                    print(f"   Status: {data['status']}")
                    return True
                else:
                    print(f"❌ Server unhealthy: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ Server connection failed: {e}")
                return False
    
    async def test_api_documentation(self):
        """Test API documentation endpoint"""
        print("\n📚 Testing API Documentation...")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/docs")
                if response.status_code == 200:
                    print("✅ API documentation accessible")
                    print(f"   URL: {self.base_url}/docs")
                    return True
                else:
                    print(f"❌ API docs failed: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ API docs error: {e}")
                return False
    
    async def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        user_data = {
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "password": "testpassword123",
            "full_name": "Test User"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/v1/auth/register",
                    json=user_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.access_token = data.get("access_token")
                    print("✅ User registration successful")
                    print(f"   User ID: {data.get('user', {}).get('id', 'N/A')}")
                    print(f"   Token received: {'✅ Yes' if self.access_token else '❌ No'}")
                    return True
                else:
                    print(f"❌ Registration failed: {response.status_code}")
                    print(f"   Response: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Registration error: {e}")
                return False
    
    async def test_linkedin_integration(self):
        """Test LinkedIn integration endpoints"""
        print("\n🔗 Testing LinkedIn Integration...")
        
        if not self.access_token:
            print("❌ No access token available for LinkedIn test")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        async with httpx.AsyncClient() as client:
            try:
                # Test LinkedIn auth URL generation
                response = await client.get(
                    f"{self.base_url}/api/v1/linkedin/auth/url?return_url=/dashboard",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    auth_url = data.get("auth_url")
                    print("✅ LinkedIn OAuth URL generated")
                    print(f"   URL length: {len(auth_url)} characters")
                    print(f"   Contains LinkedIn domain: {'✅ Yes' if 'linkedin.com' in auth_url else '❌ No'}")
                    
                    # Test connection status
                    status_response = await client.get(
                        f"{self.base_url}/api/v1/linkedin/connection/status",
                        headers=headers
                    )
                    
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        print(f"✅ Connection status retrieved")
                        print(f"   Connected: {status_data.get('connected', False)}")
                        print(f"   Status: {status_data.get('status', 'unknown')}")
                    
                    return True
                else:
                    print(f"❌ LinkedIn test failed: {response.status_code}")
                    print(f"   Response: {response.text}")
                    return False
                    
            except Exception as e:
                print(f"❌ LinkedIn integration error: {e}")
                return False
    
    async def test_resume_upload(self):
        """Test resume upload and AI analysis"""
        print("\n📄 Testing Resume Upload & AI Analysis...")
        
        if not self.access_token:
            print("❌ No access token available for resume test")
            return False
        
        # Create sample resume
        sample_resume = """
        John Doe
        Senior Software Engineer
        john.doe@email.com
        (555) 123-4567
        
        SKILLS
        Python, JavaScript, React, Django, AWS, Docker
        
        EXPERIENCE
        Senior Software Engineer - Tech Corp (2020-Present)
        • Led development of microservices architecture
        • Improved system performance by 40%
        
        EDUCATION
        Bachelor of Computer Science - University (2018)
        """
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as tmp_file:
            tmp_file.write(sample_resume)
            tmp_file_path = tmp_file.name
        
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            async with httpx.AsyncClient() as client:
                with open(tmp_file_path, 'rb') as file:
                    files = {"file": ("resume.txt", file, "text/plain")}
                    data = {"source": "test"}
                    
                    response = await client.post(
                        f"{self.base_url}/api/v1/resumes/upload",
                        headers=headers,
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    print("✅ Resume upload successful")
                    print(f"   Filename: {result.get('filename')}")
                    print(f"   Processing time: {result.get('processing_time_ms')}ms")
                    
                    parsed_data = result.get('parsed_data', {})
                    if parsed_data:
                        contact_info = parsed_data.get('contact_info', {})
                        skills = parsed_data.get('skills', [])
                        print(f"   Email extracted: {contact_info.get('email', 'N/A')}")
                        print(f"   Skills found: {len(skills)}")
                        if skills:
                            print(f"   Top skills: {', '.join(skills[:3])}")
                    
                    return True
                else:
                    print(f"❌ Resume upload failed: {response.status_code}")
                    print(f"   Response: {response.text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Resume upload error: {e}")
            return False
        finally:
            # Clean up
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    async def test_job_management(self):
        """Test job creation and management"""
        print("\n💼 Testing Job Management...")
        
        if not self.access_token:
            print("❌ No access token available for job test")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        job_data = {
            "title": "Senior Python Developer",
            "description": "Great opportunity for a Python developer with Django experience",
            "location": "San Francisco, CA",
            "job_type": "full-time",
            "experience_level": "senior",
            "skills": ["Python", "Django", "PostgreSQL", "AWS"],
            "salary_min": 120000,
            "salary_max": 160000,
            "remote_allowed": True
        }
        
        async with httpx.AsyncClient() as client:
            try:
                # Create job
                response = await client.post(
                    f"{self.base_url}/api/v1/jobs/",
                    headers=headers,
                    json=job_data
                )
                
                if response.status_code == 200:
                    job = response.json()
                    job_id = job.get("id")
                    print("✅ Job creation successful")
                    print(f"   Job ID: {job_id}")
                    print(f"   Title: {job.get('title')}")
                    print(f"   Status: {job.get('status')}")
                    
                    # Test job listing
                    list_response = await client.get(
                        f"{self.base_url}/api/v1/jobs/?page=1&size=10",
                        headers=headers
                    )
                    
                    if list_response.status_code == 200:
                        jobs_data = list_response.json()
                        print(f"✅ Job listing successful")
                        print(f"   Total jobs: {jobs_data.get('total', 0)}")
                        print(f"   Jobs in response: {len(jobs_data.get('jobs', []))}")
                    
                    return True
                else:
                    print(f"❌ Job creation failed: {response.status_code}")
                    print(f"   Response: {response.text}")
                    return False
                    
            except Exception as e:
                print(f"❌ Job management error: {e}")
                return False
    
    async def test_analytics(self):
        """Test analytics endpoints"""
        print("\n📊 Testing Analytics...")
        
        if not self.access_token:
            print("❌ No access token available for analytics test")
            return False
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/v1/analytics/dashboard",
                    headers=headers
                )
                
                if response.status_code == 200:
                    analytics = response.json()
                    print("✅ Analytics dashboard accessible")
                    print(f"   Total resumes: {analytics.get('total_resumes', 0)}")
                    print(f"   Total jobs: {analytics.get('total_jobs', 0)}")
                    print(f"   Active jobs: {analytics.get('active_jobs', 0)}")
                    return True
                else:
                    print(f"❌ Analytics failed: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"❌ Analytics error: {e}")
                return False
    
    async def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Live Integration Tests...\n")
        print(f"Testing server at: {self.base_url}")
        print("="*60)
        
        tests = [
            ("Server Health", self.test_server_health),
            ("API Documentation", self.test_api_documentation),
            ("User Registration", self.test_user_registration),
            ("LinkedIn Integration", self.test_linkedin_integration),
            ("Resume Upload", self.test_resume_upload),
            ("Job Management", self.test_job_management),
            ("Analytics", self.test_analytics)
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "="*60)
        print("📊 LIVE INTEGRATION TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:25} {status}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All integrations working perfectly!")
            print(f"\n🌐 Your API is live at: {self.base_url}")
            print(f"📚 Documentation: {self.base_url}/docs")
            print(f"🔗 LinkedIn OAuth ready for frontend integration")
            print(f"🤖 AI-powered resume analysis operational")
        else:
            print("⚠️ Some integrations need attention.")
        
        return passed == total

async def main():
    """Main test runner"""
    tester = IntegrationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
