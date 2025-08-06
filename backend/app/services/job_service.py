"""
Job service for job management operations
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple

from beanie import PydanticObjectId

from app.models.job import Job, JobCreate, JobStatus, JobUpdate
from app.models.user import User
from app.utils.timezone import now_with_timezone


class JobService:
    """Service class for job operations"""

    async def create_job(self, job_data: JobCreate, user_id: str) -> Job:
        """
        Create a new job
        """
        job = Job(
            title=job_data.title,
            description=job_data.description,
            department=job_data.department,
            location=job_data.location,
            job_type=job_data.job_type,
            experience_level=job_data.experience_level,
            requirements=job_data.requirements,
            responsibilities=job_data.responsibilities,
            benefits=job_data.benefits,
            skills=job_data.skills,
            salary=job_data.salary,
            remote_allowed=job_data.remote_allowed,
            urgent=job_data.urgent,
            closing_date=job_data.closing_date,
            status=job_data.status or JobStatus.DRAFT,
            user_id=user_id,
            created_at=now_with_timezone(),
            updated_at=now_with_timezone(),
        )

        await job.insert()
        return job

    async def get_job_by_id(self, job_id: str) -> Optional[Job]:
        """
        Get job by ID
        """
        try:
            return await Job.get(PydanticObjectId(job_id))
        except Exception:  # noqa: E722
            return None

    async def get_job_with_user(
        self, job_id: str
    ) -> Tuple[Optional[Job], Optional[User]]:
        """
        Get job by ID along with the user who created it
        """
        try:
            job = await Job.get(PydanticObjectId(job_id))
            if not job:
                return None, None

            user = await User.get(PydanticObjectId(job.user_id))
            return job, user
        except Exception:  # noqa: E722
            return None, None

    async def get_jobs(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        status: Optional[JobStatus] = None,
        department: Optional[str] = None,
    ) -> Tuple[List[Job], int]:
        """
        Get jobs with filtering and pagination
        """
        query = {"user_id": user_id}

        # Add filters
        if status:
            query["status"] = status

        if department:
            query["department"] = department

        # Build search query
        if search:
            search_query = {
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"skills": {"$in": [search]}},
                    {"location": {"$regex": search, "$options": "i"}},
                ]
            }
            query.update(search_query)

        # Get total count
        total = await Job.find(query).count()

        # Get jobs with pagination
        jobs = (
            await Job.find(query).skip(skip).limit(limit).sort("-created_at").to_list()
        )

        return jobs, total

    async def update_job(
        self, job_id: str, job_data: JobUpdate, user_id: str
    ) -> Optional[Job]:
        """
        Update job information
        """
        job = await self.get_job_by_id(job_id)
        if not job or job.user_id != user_id:
            return None

        # Update fields
        update_data = job_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)

        job.updated_at = now_with_timezone()
        await job.save()

        return job

    async def delete_job(self, job_id: str, user_id: str) -> bool:
        """
        Delete job by ID
        """
        job = await self.get_job_by_id(job_id)
        if not job or job.user_id != user_id:
            return False

        await job.delete()
        return True

    async def publish_job(self, job_id: str, user_id: str) -> Optional[Job]:
        """
        Publish job (change status to active)
        """
        job = await self.get_job_by_id(job_id)
        if not job or job.user_id != user_id:
            return None

        job.status = JobStatus.ACTIVE
        job.published_at = now_with_timezone()
        job.updated_at = now_with_timezone()
        await job.save()

        return job

    async def pause_job(self, job_id: str, user_id: str) -> Optional[Job]:
        """
        Pause job (change status to paused)
        """
        job = await self.get_job_by_id(job_id)
        if not job or job.user_id != user_id:
            return None

        job.status = JobStatus.PAUSED
        job.updated_at = now_with_timezone()
        await job.save()

        return job

    async def close_job(self, job_id: str, user_id: str) -> Optional[Job]:
        """
        Close job (change status to closed)
        """
        job = await self.get_job_by_id(job_id)
        if not job or job.user_id != user_id:
            return None

        job.status = JobStatus.CLOSED
        job.updated_at = now_with_timezone()
        await job.save()

        return job

    async def get_job_analytics(self, job_id: str, user_id: str) -> Optional[Dict]:
        """
        Get analytics for a specific job
        """
        job = await self.get_job_by_id(job_id)
        if not job or job.user_id != user_id:
            return None

        current_time = now_with_timezone()

        return {
            "job_id": job_id,
            "total_applications": job.total_applications,
            "total_views": job.total_views,
            "platforms_posted": len(job.posted_platforms),
            "platform_breakdown": [
                {
                    "platform": platform.platform_id,
                    "applications": platform.applications_count,
                    "views": platform.views_count,
                    "status": platform.status,
                }
                for platform in job.posted_platforms
            ],
            "created_at": job.created_at,
            "published_at": job.published_at,
            "days_active": (
                (current_time - job.published_at).days if job.published_at else 0
            ),
        }

    async def get_user_job_stats(self, user_id: str) -> Dict:
        """
        Get job statistics for a user
        """
        total_jobs = await Job.find({"user_id": user_id}).count()
        active_jobs = await Job.find(
            {"user_id": user_id, "status": JobStatus.ACTIVE}
        ).count()
        draft_jobs = await Job.find(
            {"user_id": user_id, "status": JobStatus.DRAFT}
        ).count()
        closed_jobs = await Job.find(
            {"user_id": user_id, "status": JobStatus.CLOSED}
        ).count()

        # Get total applications across all jobs
        jobs = await Job.find({"user_id": user_id}).to_list()
        total_applications = sum(job.total_applications for job in jobs)
        total_views = sum(job.total_views for job in jobs)

        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "draft_jobs": draft_jobs,
            "closed_jobs": closed_jobs,
            "total_applications": total_applications,
            "total_views": total_views,
            "avg_applications_per_job": (
                total_applications / total_jobs if total_jobs > 0 else 0
            ),
        }

    async def search_jobs_by_skills(self, skills: List[str], user_id: str) -> List[Job]:
        """
        Search jobs by required skills
        """
        query = {
            "user_id": user_id,
            "status": JobStatus.ACTIVE,
            "skills": {"$in": skills},
        }

        jobs = await Job.find(query).sort("-created_at").to_list()
        return jobs

    async def search_jobs_with_filters(
        self,
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        status: Optional[JobStatus] = None,
        department: Optional[str] = None,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        location: Optional[str] = None,
        skills: Optional[List[str]] = None,
        remote_allowed: Optional[bool] = None,
        urgent: Optional[bool] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        closing_after: Optional[datetime] = None,
        closing_before: Optional[datetime] = None,
    ) -> Tuple[List[Tuple[Job, Optional[User]]], int]:
        """
        Advanced search for jobs with comprehensive filtering options
        """
        query = {}

        # User filter (if provided)
        if user_id:
            query["user_id"] = user_id

        # Status filter
        if status:
            query["status"] = status

        # Department filter
        if department:
            query["department"] = department

        # Job type filter
        if job_type:
            query["job_type"] = job_type

        # Experience level filter
        if experience_level:
            query["experience_level"] = experience_level

        # Location filter
        if location:
            query["location"] = {"$regex": location, "$options": "i"}

        # Skills filter
        if skills:
            query["skills"] = {"$in": skills}

        # Remote allowed filter
        if remote_allowed is not None:
            query["remote_allowed"] = remote_allowed

        # Urgent filter
        if urgent is not None:
            query["urgent"] = urgent

        # Salary range filter
        if salary_min is not None or salary_max is not None:
            salary_query = {}
            if salary_min is not None:
                salary_query["salary.min"] = {"$gte": salary_min}
            if salary_max is not None:
                salary_query["salary.max"] = {"$lte": salary_max}
            query.update(salary_query)

        # Date filters
        if created_after or created_before:
            date_query = {}
            if created_after:
                date_query["$gte"] = created_after
            if created_before:
                date_query["$lte"] = created_before
            query["created_at"] = date_query

        if closing_after or closing_before:
            closing_query = {}
            if closing_after:
                closing_query["$gte"] = closing_after
            if closing_before:
                closing_query["$lte"] = closing_before
            query["closing_date"] = closing_query

        # Build search query for text fields
        if search:
            search_query = {
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"skills": {"$in": [search]}},
                    {"location": {"$regex": search, "$options": "i"}},
                    {"department": {"$regex": search, "$options": "i"}},
                ]
            }
            if query:
                query = {"$and": [query, search_query]}
            else:
                query = search_query

        # Get total count
        total = await Job.find(query).count()

        # Get jobs with pagination
        jobs = (
            await Job.find(query).skip(skip).limit(limit).sort("-created_at").to_list()
        )

        # Get user information for each job
        jobs_with_users = []
        for job in jobs:
            try:
                user = await User.get(PydanticObjectId(job.user_id))
                jobs_with_users.append((job, user))
            except Exception:  # noqa: E722
                jobs_with_users.append((job, None))

        return jobs_with_users, total
