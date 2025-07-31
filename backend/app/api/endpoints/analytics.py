"""
Analytics and reporting endpoints
"""

from datetime import datetime, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter()

class DashboardStats(BaseModel):
    total_resumes: int
    total_jobs: int
    total_candidates: int
    active_jobs: int
    processed_resumes_today: int
    ai_matches_today: int
    platform_posts_today: int

class PlatformPerformance(BaseModel):
    platform_name: str
    jobs_posted: int
    applications_received: int
    quality_score: float
    cost_per_hire: float

class AnalyticsTimeRange(BaseModel):
    start_date: datetime
    end_date: datetime
    total_resumes: int
    total_jobs: int
    avg_processing_time: float
    top_skills: List[str]

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get dashboard statistics
    """
    analytics_service = AnalyticsService()
    stats = await analytics_service.get_dashboard_stats(str(current_user.id))
    return stats

@router.get("/platform-performance")
async def get_platform_performance(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get job board platform performance metrics
    """
    analytics_service = AnalyticsService()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    performance = await analytics_service.get_platform_performance(
        user_id=str(current_user.id),
        start_date=start_date,
        end_date=end_date
    )
    return performance

@router.get("/resume-analytics")
async def get_resume_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get resume processing analytics
    """
    analytics_service = AnalyticsService()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    analytics = await analytics_service.get_resume_analytics(
        user_id=str(current_user.id),
        start_date=start_date,
        end_date=end_date
    )
    return analytics

@router.get("/job-analytics")
async def get_job_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get job posting and performance analytics
    """
    analytics_service = AnalyticsService()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    analytics = await analytics_service.get_job_analytics(
        user_id=str(current_user.id),
        start_date=start_date,
        end_date=end_date
    )
    return analytics

@router.get("/ai-performance")
async def get_ai_performance(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get AI screening and matching performance metrics
    """
    analytics_service = AnalyticsService()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    performance = await analytics_service.get_ai_performance(
        user_id=str(current_user.id),
        start_date=start_date,
        end_date=end_date
    )
    return performance

@router.get("/trends")
async def get_trends(
    metric: str = Query("resumes", description="Metric to analyze: resumes, jobs, matches"),
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get trend analysis for various metrics
    """
    analytics_service = AnalyticsService()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    trends = await analytics_service.get_trends(
        user_id=str(current_user.id),
        metric=metric,
        start_date=start_date,
        end_date=end_date
    )
    return trends

@router.get("/reports/summary")
async def get_summary_report(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Generate comprehensive summary report
    """
    analytics_service = AnalyticsService()
    
    report = await analytics_service.generate_summary_report(
        user_id=str(current_user.id),
        start_date=start_date,
        end_date=end_date
    )
    return report
