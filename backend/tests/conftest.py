"""
Pytest configuration and fixtures for Resume Screener Backend tests
"""

import asyncio
import os
import sys
from typing import AsyncGenerator

import pytest

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def mock_database():
    """Mock database for testing"""
    # This would be replaced with actual test database setup
    yield "mock_db"


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
    }


@pytest.fixture
def sample_job_data():
    """Sample job data for testing"""
    return {
        "title": "Software Engineer",
        "description": "Great job opportunity",
        "location": "Remote",
        "skills": ["Python", "JavaScript", "React"],
        "experience_level": "mid",
    }


@pytest.fixture
def sample_candidate_data():
    """Sample candidate data for testing"""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "skills": ["Python", "Django", "React"],
    }


@pytest.fixture
def sample_resume_text():
    """Sample resume text for testing"""
    return """
    John Doe
    Software Engineer
    john.doe@email.com
    (555) 123-4567
    San Francisco, CA
    
    SUMMARY
    Experienced software engineer with 5+ years in full-stack development.
    
    SKILLS
    Python, JavaScript, React, Django, PostgreSQL, AWS
    
    EXPERIENCE
    Senior Software Engineer - Tech Corp (2020-Present)
    Software Engineer - Startup Inc (2018-2020)
    
    EDUCATION
    Bachelor of Computer Science - University (2018)
    """
