"""
Job models for job posting and management
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Dict, List, Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field
from pymongo import IndexModel


class JobStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    EXPIRED = "expired"


class JobType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    EXECUTIVE = "executive"


class SalaryInfo(BaseModel):
    min: Optional[int] = None
    max: Optional[int] = None
    currency: str = "USD"
    period: str = "yearly"  # yearly, monthly, hourly


class PlatformPosting(BaseModel):
    platform_id: str
    external_job_id: Optional[str] = None
    posted_at: Optional[datetime] = None
    status: str = "pending"  # pending, posted, failed
    post_url: Optional[str] = None
    error_message: Optional[str] = None
    applications_count: int = 0
    views_count: int = 0


class Job(Document):
    """Job document model"""

    # Basic job information
    title: Annotated[str, Indexed()]
    description: str
    department: Optional[str] = None
    location: str
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.MID

    # Job details
    requirements: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    skills: List[str] = []

    # Salary and compensation
    salary: Optional[SalaryInfo] = None

    # Job settings
    status: JobStatus = JobStatus.DRAFT
    remote_allowed: bool = False
    urgent: bool = False

    # Posting information
    posted_platforms: List[PlatformPosting] = []
    total_applications: int = 0
    total_views: int = 0

    # Dates
    closing_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None

    # User association
    user_id: Annotated[str, Indexed()]

    # Analytics
    analytics: Dict = Field(default_factory=dict)

    class Settings:
        name = "jobs"
        indexes = [
            IndexModel([("user_id", 1)]),
            IndexModel([("status", 1)]),
            IndexModel([("title", "text"), ("description", "text")]),
            IndexModel([("created_at", -1)]),
            IndexModel([("closing_date", 1)]),
            IndexModel([("skills", 1)]),
        ]


class JobCreate(BaseModel):
    """Schema for creating a new job"""

    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=10)
    department: Optional[str] = None
    location: str = Field(..., min_length=1)
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.MID
    requirements: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    skills: List[str] = []
    salary: Optional[SalaryInfo] = None
    remote_allowed: bool = False
    urgent: bool = False
    closing_date: Optional[datetime] = None


class JobUpdate(BaseModel):
    """Schema for updating job information"""

    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    salary: Optional[SalaryInfo] = None
    remote_allowed: Optional[bool] = None
    urgent: Optional[bool] = None
    status: Optional[JobStatus] = None
    closing_date: Optional[datetime] = None


class CreatedByInfo(BaseModel):
    """Schema for created by user information"""

    id: str
    full_name: str
    email: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None


class JobResponse(BaseModel):
    """Schema for job response"""

    id: str
    title: str
    description: str
    department: Optional[str] = None
    location: str
    job_type: JobType
    experience_level: ExperienceLevel
    requirements: List[str]
    responsibilities: List[str]
    benefits: List[str]
    skills: List[str]
    salary: Optional[SalaryInfo] = None
    status: JobStatus
    remote_allowed: bool
    urgent: bool
    posted_platforms: List[PlatformPosting]
    total_applications: int
    total_views: int
    closing_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    user_id: str
    created_by: Optional[CreatedByInfo] = None

    @classmethod
    def from_orm(cls, job: Job, created_by_user=None):
        created_by_info = None
        if created_by_user:
            created_by_info = CreatedByInfo(
                id=str(created_by_user.id),
                full_name=created_by_user.full_name,
                email=created_by_user.email,
                job_title=created_by_user.job_title,
                company_name=created_by_user.company_name,
            )

        return cls(
            id=str(job.id),
            title=job.title,
            description=job.description,
            department=job.department,
            location=job.location,
            job_type=job.job_type,
            experience_level=job.experience_level,
            requirements=job.requirements,
            responsibilities=job.responsibilities,
            benefits=job.benefits,
            skills=job.skills,
            salary=job.salary,
            status=job.status,
            remote_allowed=job.remote_allowed,
            urgent=job.urgent,
            posted_platforms=job.posted_platforms,
            total_applications=job.total_applications,
            total_views=job.total_views,
            closing_date=job.closing_date,
            created_at=job.created_at,
            updated_at=job.updated_at,
            published_at=job.published_at,
            user_id=job.user_id,
            created_by=created_by_info,
        )
