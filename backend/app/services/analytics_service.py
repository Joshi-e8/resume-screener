"""
Analytics service for metrics and reporting
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from app.models.analytics import (AnalyticsEvent, DailyMetrics, EventType,
                                  PlatformMetrics)
from app.services.candidate_service import CandidateService
from app.services.job_service import JobService
from app.services.user_service import UserService


class AnalyticsService:
    """Service class for analytics operations"""

    def __init__(self):
        self.job_service = JobService()
        self.candidate_service = CandidateService()
        self.user_service = UserService()

    async def track_event(
        self,
        event_type: EventType,
        user_id: str,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        properties: Optional[Dict] = None,
        platform: Optional[str] = None,
        processing_time_ms: Optional[int] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> AnalyticsEvent:
        """
        Track an analytics event
        """
        event = AnalyticsEvent(
            event_type=event_type,
            user_id=user_id,
            entity_id=entity_id,
            entity_type=entity_type,
            properties=properties or {},
            platform=platform,
            processing_time_ms=processing_time_ms,
            success=success,
            error_message=error_message,
            timestamp=datetime.now(timezone.utc),
        )

        await event.insert()
        return event

    async def get_dashboard_stats(self, user_id: str) -> Dict:
        """
        Get dashboard statistics for user
        """
        # Get job stats
        job_stats = await self.job_service.get_user_job_stats(user_id)

        # Get candidate stats
        candidate_stats = await self.candidate_service.get_candidate_stats(user_id)

        # Get today's events
        today = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        tomorrow = today + timedelta(days=1)

        today_events = await AnalyticsEvent.find(
            {"user_id": user_id, "timestamp": {"$gte": today, "$lt": tomorrow}}
        ).to_list()

        # Count today's activities
        processed_resumes_today = len(
            [e for e in today_events if e.event_type == EventType.RESUME_PROCESSED]
        )

        ai_matches_today = len(
            [e for e in today_events if e.event_type == EventType.CANDIDATE_MATCHED]
        )

        platform_posts_today = len(
            [e for e in today_events if e.event_type == EventType.JOB_POSTED]
        )

        return {
            "total_resumes": candidate_stats["total_candidates"],
            "total_jobs": job_stats["total_jobs"],
            "total_candidates": candidate_stats["total_candidates"],
            "active_jobs": job_stats["active_jobs"],
            "processed_resumes_today": processed_resumes_today,
            "ai_matches_today": ai_matches_today,
            "platform_posts_today": platform_posts_today,
        }

    async def get_platform_performance(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> List[Dict]:
        """
        Get platform performance metrics
        """
        # Get platform metrics from the date range
        platform_metrics = await PlatformMetrics.find(
            {"user_id": user_id, "date": {"$gte": start_date, "$lte": end_date}}
        ).to_list()

        # Aggregate by platform
        platform_data = defaultdict(
            lambda: {
                "jobs_posted": 0,
                "applications_received": 0,
                "total_cost": 0.0,
                "successful_posts": 0,
                "failed_posts": 0,
            }
        )

        for metric in platform_metrics:
            platform_id = metric.platform_id
            platform_data[platform_id]["jobs_posted"] += metric.jobs_posted
            platform_data[platform_id][
                "applications_received"
            ] += metric.applications_received
            platform_data[platform_id]["successful_posts"] += metric.successful_posts
            platform_data[platform_id]["failed_posts"] += metric.failed_posts

            if metric.cost_per_post:
                platform_data[platform_id]["total_cost"] += (
                    metric.cost_per_post * metric.jobs_posted
                )

        # Format response
        result = []
        for platform_id, data in platform_data.items():
            total_posts = data["successful_posts"] + data["failed_posts"]
            success_rate = (
                (data["successful_posts"] / total_posts * 100) if total_posts > 0 else 0
            )

            cost_per_hire = 0
            if data["applications_received"] > 0:
                cost_per_hire = data["total_cost"] / data["applications_received"]

            result.append(
                {
                    "platform_name": platform_id,
                    "jobs_posted": data["jobs_posted"],
                    "applications_received": data["applications_received"],
                    "quality_score": 85.0,  # Placeholder
                    "cost_per_hire": cost_per_hire,
                    "success_rate": success_rate,
                }
            )

        return result

    async def get_resume_analytics(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> Dict:
        """
        Get resume processing analytics
        """
        # Get resume-related events
        events = await AnalyticsEvent.find(
            {
                "user_id": user_id,
                "timestamp": {"$gte": start_date, "$lte": end_date},
                "event_type": {
                    "$in": [
                        EventType.RESUME_UPLOADED,
                        EventType.RESUME_PROCESSED,
                        EventType.AI_ANALYSIS_COMPLETED,
                    ]
                },
            }
        ).to_list()

        uploaded_count = len(
            [e for e in events if e.event_type == EventType.RESUME_UPLOADED]
        )
        processed_count = len(
            [e for e in events if e.event_type == EventType.RESUME_PROCESSED]
        )
        ai_analyzed_count = len(
            [e for e in events if e.event_type == EventType.AI_ANALYSIS_COMPLETED]
        )

        # Calculate average processing time
        processing_times = [
            e.processing_time_ms
            for e in events
            if e.processing_time_ms and e.event_type == EventType.RESUME_PROCESSED
        ]
        avg_processing_time = (
            sum(processing_times) / len(processing_times) if processing_times else 0
        )

        return {
            "resumes_uploaded": uploaded_count,
            "resumes_processed": processed_count,
            "ai_analyses_completed": ai_analyzed_count,
            "avg_processing_time_ms": avg_processing_time,
            "processing_success_rate": (
                (processed_count / uploaded_count * 100) if uploaded_count > 0 else 0
            ),
        }

    async def get_job_analytics(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> Dict:
        """
        Get job posting analytics
        """
        # Get job-related events
        events = await AnalyticsEvent.find(
            {
                "user_id": user_id,
                "timestamp": {"$gte": start_date, "$lte": end_date},
                "event_type": {
                    "$in": [
                        EventType.JOB_CREATED,
                        EventType.JOB_POSTED,
                        EventType.APPLICATION_RECEIVED,
                    ]
                },
            }
        ).to_list()

        jobs_created = len([e for e in events if e.event_type == EventType.JOB_CREATED])
        jobs_posted = len([e for e in events if e.event_type == EventType.JOB_POSTED])
        applications_received = len(
            [e for e in events if e.event_type == EventType.APPLICATION_RECEIVED]
        )

        return {
            "jobs_created": jobs_created,
            "jobs_posted": jobs_posted,
            "applications_received": applications_received,
            "avg_applications_per_job": (
                applications_received / jobs_posted if jobs_posted > 0 else 0
            ),
        }

    async def get_ai_performance(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> Dict:
        """
        Get AI performance metrics
        """
        # Get AI-related events
        events = await AnalyticsEvent.find(
            {
                "user_id": user_id,
                "timestamp": {"$gte": start_date, "$lte": end_date},
                "event_type": {
                    "$in": [
                        EventType.AI_ANALYSIS_COMPLETED,
                        EventType.CANDIDATE_MATCHED,
                    ]
                },
            }
        ).to_list()

        ai_analyses = [
            e for e in events if e.event_type == EventType.AI_ANALYSIS_COMPLETED
        ]
        candidate_matches = [
            e for e in events if e.event_type == EventType.CANDIDATE_MATCHED
        ]

        # Calculate average processing time for AI
        ai_processing_times = [
            e.processing_time_ms for e in ai_analyses if e.processing_time_ms
        ]
        avg_ai_processing_time = (
            sum(ai_processing_times) / len(ai_processing_times)
            if ai_processing_times
            else 0
        )

        # Calculate success rate
        successful_analyses = len([e for e in ai_analyses if e.success])
        ai_success_rate = (
            (successful_analyses / len(ai_analyses) * 100) if ai_analyses else 0
        )

        return {
            "total_ai_analyses": len(ai_analyses),
            "candidate_matches_generated": len(candidate_matches),
            "avg_processing_time_ms": avg_ai_processing_time,
            "success_rate": ai_success_rate,
            "accuracy_score": 94.5,  # Placeholder - would be calculated from feedback
        }

    async def get_trends(
        self, user_id: str, metric: str, start_date: datetime, end_date: datetime
    ) -> Dict:
        """
        Get trend data for a specific metric
        """
        # Generate daily data points
        current_date = start_date
        data_points = []

        while current_date <= end_date:
            next_date = current_date + timedelta(days=1)

            # Get events for this day
            day_events = await AnalyticsEvent.find(
                {
                    "user_id": user_id,
                    "timestamp": {"$gte": current_date, "$lt": next_date},
                }
            ).to_list()

            # Calculate metric value based on type
            if metric == "resumes":
                value = len(
                    [
                        e
                        for e in day_events
                        if e.event_type == EventType.RESUME_PROCESSED
                    ]
                )
            elif metric == "jobs":
                value = len(
                    [e for e in day_events if e.event_type == EventType.JOB_POSTED]
                )
            elif metric == "matches":
                value = len(
                    [
                        e
                        for e in day_events
                        if e.event_type == EventType.CANDIDATE_MATCHED
                    ]
                )
            else:
                value = 0

            data_points.append(
                {
                    "date": current_date,
                    "value": float(value),
                    "label": current_date.strftime("%Y-%m-%d"),
                }
            )

            current_date = next_date

        # Calculate total change
        if len(data_points) >= 2:
            first_value = data_points[0]["value"]
            last_value = data_points[-1]["value"]
            total_change = last_value - first_value
            percentage_change = (
                (total_change / first_value * 100) if first_value > 0 else 0
            )
        else:
            total_change = 0
            percentage_change = 0

        return {
            "metric": metric,
            "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "data_points": data_points,
            "total_change": total_change,
            "percentage_change": percentage_change,
        }

    async def generate_summary_report(
        self, user_id: str, start_date: datetime, end_date: datetime
    ) -> Dict:
        """
        Generate comprehensive summary report
        """
        dashboard_stats = await self.get_dashboard_stats(user_id)
        platform_performance = await self.get_platform_performance(
            user_id, start_date, end_date
        )
        resume_analytics = await self.get_resume_analytics(
            user_id, start_date, end_date
        )
        job_analytics = await self.get_job_analytics(user_id, start_date, end_date)
        ai_performance = await self.get_ai_performance(user_id, start_date, end_date)

        return {
            "report_period": {
                "start_date": start_date,
                "end_date": end_date,
                "days": (end_date - start_date).days,
            },
            "dashboard_stats": dashboard_stats,
            "platform_performance": platform_performance,
            "resume_analytics": resume_analytics,
            "job_analytics": job_analytics,
            "ai_performance": ai_performance,
            "generated_at": datetime.now(timezone.utc),
        }
