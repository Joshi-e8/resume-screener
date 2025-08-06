"""
Analytics models for tracking metrics and performance
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Any, Dict, List, Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field
from pymongo import IndexModel


class EventType(str, Enum):
    RESUME_UPLOADED = "resume_uploaded"
    RESUME_PROCESSED = "resume_processed"
    JOB_CREATED = "job_created"
    JOB_POSTED = "job_posted"
    JOB_POSTING_FAILED = "job_posting_failed"
    CANDIDATE_MATCHED = "candidate_matched"
    APPLICATION_RECEIVED = "application_received"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    CANDIDATE_HIRED = "candidate_hired"
    PLATFORM_CONNECTION_INITIATED = "platform_connection_initiated"
    PLATFORM_CONNECTED = "platform_connected"
    PLATFORM_CONNECTION_FAILED = "platform_connection_failed"
    PLATFORM_DISCONNECTED = "platform_disconnected"
    AI_ANALYSIS_COMPLETED = "ai_analysis_completed"
    USER_REGISTERED = "user_registered"
    USER_LOGIN = "user_login"
    DASHBOARD_VIEWED = "dashboard_viewed"


class AnalyticsEvent(Document):
    """Analytics event tracking"""

    event_type: EventType
    user_id: Annotated[str, Indexed()]

    # Event data
    entity_id: Optional[str] = None  # job_id, candidate_id, etc.
    entity_type: Optional[str] = None  # job, candidate, resume, etc.

    # Event details
    properties: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    # Platform information
    platform: Optional[str] = None  # linkedin, indeed, etc.
    source: Optional[str] = None

    # Performance metrics
    processing_time_ms: Optional[int] = None
    success: bool = True
    error_message: Optional[str] = None

    # Timestamp
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "analytics_events"
        indexes = [
            IndexModel([("user_id", 1), ("timestamp", -1)]),
            IndexModel([("event_type", 1), ("timestamp", -1)]),
            IndexModel([("entity_id", 1), ("entity_type", 1)]),
            IndexModel([("platform", 1), ("timestamp", -1)]),
            IndexModel([("timestamp", -1)]),
        ]


class DailyMetrics(Document):
    """Daily aggregated metrics"""

    date: Annotated[datetime, Indexed()]
    user_id: Annotated[str, Indexed()]

    # Resume metrics
    resumes_uploaded: int = 0
    resumes_processed: int = 0
    avg_processing_time_ms: Optional[float] = None

    # Job metrics
    jobs_created: int = 0
    jobs_posted: int = 0
    total_job_views: int = 0
    total_applications: int = 0

    # Candidate metrics
    candidates_added: int = 0
    candidates_matched: int = 0
    interviews_scheduled: int = 0
    candidates_hired: int = 0

    # Platform metrics
    platform_posts: Dict[str, int] = Field(default_factory=dict)
    platform_applications: Dict[str, int] = Field(default_factory=dict)

    # AI metrics
    ai_analyses_completed: int = 0
    avg_match_score: Optional[float] = None

    # Quality metrics
    successful_operations: int = 0
    failed_operations: int = 0
    error_rate: float = 0.0

    class Settings:
        name = "daily_metrics"
        indexes = [
            IndexModel([("user_id", 1), ("date", -1)]),
            IndexModel([("date", -1)]),
        ]


class PlatformMetrics(Document):
    """Platform-specific performance metrics"""

    platform_id: Annotated[str, Indexed()]
    user_id: Annotated[str, Indexed()]
    date: Annotated[datetime, Indexed()]

    # Posting metrics
    jobs_posted: int = 0
    successful_posts: int = 0
    failed_posts: int = 0

    # Performance metrics
    applications_received: int = 0
    job_views: int = 0
    click_through_rate: float = 0.0

    # Quality metrics
    quality_score: float = 0.0
    avg_candidate_rating: Optional[float] = None

    # Cost metrics
    cost_per_post: Optional[float] = None
    cost_per_application: Optional[float] = None
    cost_per_hire: Optional[float] = None

    # Response times
    avg_response_time_ms: Optional[float] = None

    class Settings:
        name = "platform_metrics"
        indexes = [
            IndexModel([("user_id", 1), ("platform_id", 1), ("date", -1)]),
            IndexModel([("platform_id", 1), ("date", -1)]),
        ]


class UserUsageStats(Document):
    """User usage statistics and limits"""

    user_id: Annotated[str, Indexed(unique=True)]

    # Current period usage (monthly)
    current_period_start: datetime
    current_period_end: datetime

    # Usage counts
    resumes_processed_count: int = 0
    jobs_posted_count: int = 0
    api_calls_count: int = 0
    ai_analyses_count: int = 0

    # Limits based on subscription
    resumes_limit: Optional[int] = None
    jobs_limit: Optional[int] = None
    api_calls_limit: Optional[int] = None

    # Feature usage
    platforms_connected: List[str] = []
    features_used: List[str] = []

    # Last updated
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "user_usage_stats"
        indexes = [
            IndexModel([("user_id", 1)], unique=True),
            IndexModel([("current_period_end", 1)]),
        ]


# Response models for API
class DashboardStatsResponse(BaseModel):
    total_resumes: int
    total_jobs: int
    total_candidates: int
    active_jobs: int
    processed_resumes_today: int
    ai_matches_today: int
    platform_posts_today: int


class PlatformPerformanceResponse(BaseModel):
    platform_name: str
    jobs_posted: int
    applications_received: int
    quality_score: float
    cost_per_hire: Optional[float] = None
    success_rate: float


class TrendDataPoint(BaseModel):
    date: datetime
    value: float
    label: Optional[str] = None


class TrendsResponse(BaseModel):
    metric: str
    period: str
    data_points: List[TrendDataPoint]
    total_change: float
    percentage_change: float
