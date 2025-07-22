"""
Candidate models for candidate management and tracking
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Annotated
from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field
from pymongo import IndexModel
from enum import Enum

class CandidateStatus(str, Enum):
    NEW = "new"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    INTERVIEWED = "interviewed"
    OFFERED = "offered"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class EducationLevel(str, Enum):
    HIGH_SCHOOL = "high_school"
    ASSOCIATE = "associate"
    BACHELOR = "bachelor"
    MASTER = "master"
    DOCTORATE = "doctorate"
    PROFESSIONAL = "professional"

class WorkExperience(BaseModel):
    company: str
    position: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    description: Optional[str] = None
    is_current: bool = False

class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    graduation_date: Optional[datetime] = None
    gpa: Optional[float] = None

class JobMatchScore(BaseModel):
    job_id: str
    score: float  # 0-100
    match_details: Dict = Field(default_factory=dict)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Candidate(Document):
    """Candidate document model"""
    
    # Personal information
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    
    # Professional information
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[int] = None
    expected_salary: Optional[int] = None
    
    # Skills and qualifications
    skills: List[str] = []
    certifications: List[str] = []
    languages: List[str] = []
    
    # Work history
    work_experience: List[WorkExperience] = []
    education: List[Education] = []
    
    # Resume information
    resume_filename: Optional[str] = None
    resume_file_path: Optional[str] = None
    resume_text: Optional[str] = None
    resume_parsed_data: Dict = Field(default_factory=dict)
    
    # Application tracking
    status: CandidateStatus = CandidateStatus.NEW
    source: Optional[str] = None  # linkedin, indeed, direct, etc.
    applied_jobs: List[str] = []  # job IDs
    
    # AI analysis
    ai_summary: Optional[str] = None
    job_match_scores: List[JobMatchScore] = []
    strengths: List[str] = []
    areas_for_improvement: List[str] = []
    
    # Notes and feedback
    notes: List[Dict] = []  # {note: str, created_by: str, created_at: datetime}
    interview_feedback: List[Dict] = []
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_contacted: Optional[datetime] = None
    
    # User association
    user_id: Annotated[str, Indexed()]
    
    class Settings:
        name = "candidates"
        indexes = [
            IndexModel([("user_id", 1)]),
            IndexModel([("email", 1)]),
            IndexModel([("status", 1)]),
            IndexModel([("first_name", "text"), ("last_name", "text")]),
            IndexModel([("skills", 1)]),
            IndexModel([("created_at", -1)]),
            IndexModel([("years_of_experience", 1)]),
        ]

class CandidateCreate(BaseModel):
    """Schema for creating a new candidate"""
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0)
    expected_salary: Optional[int] = Field(None, ge=0)
    skills: List[str] = []
    certifications: List[str] = []
    languages: List[str] = []
    source: Optional[str] = None
    user_id: Optional[str] = None

class CandidateUpdate(BaseModel):
    """Schema for updating candidate information"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0)
    expected_salary: Optional[int] = Field(None, ge=0)
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    status: Optional[CandidateStatus] = None

class CandidateSearchFilters(BaseModel):
    """Search filters for candidates"""
    skills: Optional[List[str]] = None
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    location: Optional[str] = None
    job_title: Optional[str] = None

class CandidateResponse(BaseModel):
    """Schema for candidate response"""
    id: str
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[int] = None
    expected_salary: Optional[int] = None
    skills: List[str]
    certifications: List[str]
    languages: List[str]
    work_experience: List[WorkExperience]
    education: List[Education]
    status: CandidateStatus
    source: Optional[str] = None
    applied_jobs: List[str]
    ai_summary: Optional[str] = None
    job_match_scores: List[JobMatchScore]
    strengths: List[str]
    areas_for_improvement: List[str]
    created_at: datetime
    updated_at: datetime
    last_contacted: Optional[datetime] = None
    user_id: str
    
    @classmethod
    def from_orm(cls, candidate: Candidate):
        return cls(
            id=str(candidate.id),
            first_name=candidate.first_name,
            last_name=candidate.last_name,
            email=candidate.email,
            phone=candidate.phone,
            location=candidate.location,
            current_job_title=candidate.current_job_title,
            current_company=candidate.current_company,
            years_of_experience=candidate.years_of_experience,
            expected_salary=candidate.expected_salary,
            skills=candidate.skills,
            certifications=candidate.certifications,
            languages=candidate.languages,
            work_experience=candidate.work_experience,
            education=candidate.education,
            status=candidate.status,
            source=candidate.source,
            applied_jobs=candidate.applied_jobs,
            ai_summary=candidate.ai_summary,
            job_match_scores=candidate.job_match_scores,
            strengths=candidate.strengths,
            areas_for_improvement=candidate.areas_for_improvement,
            created_at=candidate.created_at,
            updated_at=candidate.updated_at,
            last_contacted=candidate.last_contacted,
            user_id=candidate.user_id
        )
