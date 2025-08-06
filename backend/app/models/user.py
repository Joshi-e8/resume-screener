"""
User models for authentication and user management
"""

from datetime import datetime, timezone
from typing import Annotated, List, Optional

from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field
from pymongo import IndexModel


class User(Document):
    """User document model"""

    email: Annotated[EmailStr, Indexed(unique=True)]
    full_name: str
    company_name: Optional[str] = None
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    permissions: Optional[List[str]] = []

    # Profile information
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None

    # Subscription and billing
    subscription_plan: str = "free"  # free, basic, premium, enterprise
    subscription_expires: Optional[datetime] = None

    # Usage tracking
    resumes_processed: int = 0
    jobs_posted: int = 0
    api_calls_count: int = 0

    # Platform connections
    connected_platforms: Optional[List[str]] = []

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("email", 1)], unique=True),
            IndexModel([("company_name", 1)]),
            IndexModel([("subscription_plan", 1)]),
            IndexModel([("created_at", -1)]),
        ]


class UserCreate(BaseModel):
    """Schema for creating a new user"""

    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1)
    company_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user information"""

    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """Schema for user response (excluding sensitive data)"""

    id: str
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    is_superuser: bool
    subscription_plan: str
    subscription_expires: Optional[datetime] = None
    resumes_processed: int
    jobs_posted: int
    connected_platforms: Optional[List[str]] = []
    created_at: datetime
    last_login: Optional[datetime] = None

    @classmethod
    def from_orm(cls, user: User):
        return cls(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            company_name=user.company_name,
            phone=user.phone,
            job_title=user.job_title,
            department=user.department,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            subscription_plan=user.subscription_plan,
            subscription_expires=user.subscription_expires,
            resumes_processed=user.resumes_processed,
            jobs_posted=user.jobs_posted,
            connected_platforms=user.connected_platforms,
            created_at=user.created_at,
            last_login=user.last_login,
        )
