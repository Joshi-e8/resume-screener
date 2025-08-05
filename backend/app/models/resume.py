"""
Database models for Resume Screener application
"""

from datetime import datetime, timezone
from typing import List, Optional

from beanie import Document
from pydantic import BaseModel, Field


class PersonalInfo(BaseModel):
    """Personal information extracted from resume"""

    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None


class Education(BaseModel):
    """Education information"""

    degree: str
    institution: str
    year: Optional[str] = None
    gpa: Optional[str] = None
    relevant_courses: Optional[List[str]] = []


class Experience(BaseModel):
    """Work experience information"""

    title: str
    company: str
    duration: str
    description: str
    technologies: Optional[List[str]] = []


class Project(BaseModel):
    """Project information"""

    name: str
    description: str
    technologies: Optional[List[str]] = []
    url: Optional[str] = None


class ParsedResume(BaseModel):
    """Complete parsed resume data"""

    personal_info: PersonalInfo
    summary: Optional[str] = None
    skills: List[str] = []
    experience: List[Experience] = []
    education: List[Education] = []
    certifications: Optional[List[str]] = []
    languages: Optional[List[str]] = []
    projects: Optional[List[Project]] = []


class MatchScore(BaseModel):
    """Resume matching score against job description"""

    overall_score: float = Field(..., ge=0, le=100)
    skills_match: float = Field(..., ge=0, le=100)
    experience_match: float = Field(..., ge=0, le=100)
    education_match: float = Field(..., ge=0, le=100)
    breakdown: dict = {
        "matched_skills": [],
        "missing_skills": [],
        "experience_relevance": "",
        "education_relevance": "",
    }


class AIAnalysis(BaseModel):
    """AI-generated analysis of resume"""

    summary: str
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendation: str = Field(..., pattern="^(SHORTLIST|REJECT|MAYBE)$")
    reasoning: str


class UploadedResume(Document):
    """Document model for uploaded resume files"""

    filename: str
    original_name: str
    file_path: str
    file_size: int
    mime_type: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(
        default="UPLOADED", pattern="^(UPLOADED|PROCESSING|PARSED|ERROR)$"
    )
    error_message: Optional[str] = None

    class Settings:
        name = "uploaded_resumes"
        indexes = ["filename", "uploaded_at", "status"]


class JobDescription(Document):
    """Document model for job descriptions"""

    title: str
    company: str
    description: str
    requirements: List[str] = []
    preferred_skills: List[str] = []
    experience_level: str
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "job_descriptions"
        indexes = ["title", "company", "created_at"]


class ResumeAnalysis(Document):
    """Document model for resume analysis results"""

    resume_id: str
    job_description_id: str
    parsed_resume: ParsedResume
    match_score: MatchScore
    ai_analysis: AIAnalysis
    status: str = Field(
        default="PENDING", pattern="^(PENDING|ANALYZED|SHORTLISTED|REJECTED)$"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "resume_analyses"
        indexes = [
            "resume_id",
            "job_description_id",
            "status",
            [("match_score.overall_score", -1)],
            "created_at",
        ]
