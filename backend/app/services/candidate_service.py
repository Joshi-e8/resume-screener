"""
Candidate service for candidate management operations
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from beanie import PydanticObjectId

from app.models.candidate import (
    Candidate,
    CandidateCreate,
    CandidateSearchFilters,
    CandidateStatus,
    CandidateUpdate,
    JobMatchScore,
)


class CandidateService:
    """Service class for candidate operations"""

    async def create_candidate(self, candidate_data: CandidateCreate) -> Candidate:
        """
        Create a new candidate
        """
        candidate = Candidate(
            first_name=candidate_data.first_name,
            last_name=candidate_data.last_name,
            email=candidate_data.email,
            phone=candidate_data.phone,
            location=candidate_data.location,
            current_job_title=candidate_data.current_job_title,
            current_company=candidate_data.current_company,
            years_of_experience=candidate_data.years_of_experience,
            expected_salary=candidate_data.expected_salary,
            skills=candidate_data.skills,
            certifications=candidate_data.certifications,
            languages=candidate_data.languages,
            source=candidate_data.source,
            status=CandidateStatus.NEW,
            user_id=candidate_data.user_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        await candidate.insert()
        return candidate

    async def get_candidate_by_id(self, candidate_id: str) -> Optional[Candidate]:
        """
        Get candidate by ID
        """
        try:
            return await Candidate.get(PydanticObjectId(candidate_id))
        except Exception:
            return None

    async def get_candidates(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        filters: Optional[CandidateSearchFilters] = None,
    ) -> Tuple[List[Candidate], int]:
        """
        Get candidates with filtering and pagination
        """
        query = {"user_id": user_id}

        # Add search
        if search:
            search_query = {
                "$or": [
                    {"first_name": {"$regex": search, "$options": "i"}},
                    {"last_name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"current_job_title": {"$regex": search, "$options": "i"}},
                    {"current_company": {"$regex": search, "$options": "i"}},
                    {"skills": {"$in": [search]}},
                ]
            }
            query.update(search_query)

        # Add filters
        if filters:
            if filters.skills:
                query["skills"] = {"$in": filters.skills}

            if filters.experience_min is not None:
                query["years_of_experience"] = {"$gte": filters.experience_min}

            if filters.experience_max is not None:
                if "years_of_experience" in query:
                    query["years_of_experience"]["$lte"] = filters.experience_max
                else:
                    query["years_of_experience"] = {"$lte": filters.experience_max}

            if filters.location:
                query["location"] = {"$regex": filters.location, "$options": "i"}

        # Get total count
        total = await Candidate.find(query).count()

        # Get candidates with pagination
        candidates = (
            await Candidate.find(query)
            .skip(skip)
            .limit(limit)
            .sort("-created_at")
            .to_list()
        )

        return candidates, total

    async def update_candidate(
        self, candidate_id: str, candidate_data: CandidateUpdate
    ) -> Optional[Candidate]:
        """
        Update candidate information
        """
        candidate = await self.get_candidate_by_id(candidate_id)
        if not candidate:
            return None

        # Update fields
        update_data = candidate_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(candidate, field, value)

        candidate.updated_at = datetime.now(timezone.utc)
        await candidate.save()

        return candidate

    async def delete_candidate(self, candidate_id: str) -> bool:
        """
        Delete candidate by ID
        """
        candidate = await self.get_candidate_by_id(candidate_id)
        if not candidate:
            return False

        await candidate.delete()
        return True

    async def add_note(self, candidate_id: str, note: str, created_by: str) -> bool:
        """
        Add note to candidate
        """
        candidate = await self.get_candidate_by_id(candidate_id)
        if not candidate:
            return False

        note_data = {
            "note": note,
            "created_by": created_by,
            "created_at": datetime.now(timezone.utc),
        }

        if not candidate.notes:
            candidate.notes = []

        candidate.notes.append(note_data)
        candidate.updated_at = datetime.now(timezone.utc)
        await candidate.save()

        return True

    async def update_status(
        self, candidate_id: str, status: CandidateStatus
    ) -> Optional[Candidate]:
        """
        Update candidate status
        """
        candidate = await self.get_candidate_by_id(candidate_id)
        if not candidate:
            return None

        candidate.status = status
        candidate.updated_at = datetime.now(timezone.utc)
        await candidate.save()

        return candidate

    async def calculate_job_match_score(
        self, candidate_id: str, job_id: str
    ) -> Optional[JobMatchScore]:
        """
        Calculate AI match score for candidate against job
        This is a placeholder - will be implemented with GROQ AI integration
        """
        candidate = await self.get_candidate_by_id(candidate_id)
        if not candidate:
            return None

        # Placeholder scoring logic
        # TODO: Implement with GROQ AI
        base_score = 50.0

        # Simple skill matching for now
        from app.services.job_service import JobService

        job_service = JobService()
        job = await job_service.get_job_by_id(job_id)

        if not job:
            return None

        # Calculate skill overlap
        candidate_skills = set(skill.lower() for skill in candidate.skills)
        job_skills = set(skill.lower() for skill in job.skills)

        if job_skills:
            skill_match = len(candidate_skills.intersection(job_skills)) / len(
                job_skills
            )
            base_score += skill_match * 30

        # Experience level matching
        if candidate.years_of_experience:
            if (
                job.experience_level.value == "entry"
                and candidate.years_of_experience <= 2
            ):
                base_score += 10
            elif (
                job.experience_level.value == "mid"
                and 2 <= candidate.years_of_experience <= 5
            ):
                base_score += 15
            elif (
                job.experience_level.value == "senior"
                and candidate.years_of_experience >= 5
            ):
                base_score += 15

        # Location matching
        if candidate.location and job.location:
            if (
                candidate.location.lower() in job.location.lower()
                or job.location.lower() in candidate.location.lower()
            ):
                base_score += 10

        # Cap at 100
        final_score = min(base_score, 100.0)

        match_score = JobMatchScore(
            job_id=job_id,
            score=final_score,
            match_details={
                "skill_match": skill_match if "skill_match" in locals() else 0,
                "experience_match": candidate.years_of_experience or 0,
                "location_match": (
                    candidate.location == job.location
                    if candidate.location and job.location
                    else False
                ),
            },
        )

        # Update candidate with match score
        if not candidate.job_match_scores:
            candidate.job_match_scores = []

        # Remove existing score for this job
        candidate.job_match_scores = [
            score for score in candidate.job_match_scores if score.job_id != job_id
        ]

        candidate.job_match_scores.append(match_score)
        candidate.updated_at = datetime.now(timezone.utc)
        await candidate.save()

        return match_score

    async def find_job_matches(self, candidate_id: str, limit: int = 10) -> List[Dict]:
        """
        Find best job matches for candidate
        """
        candidate = await self.get_candidate_by_id(candidate_id)
        if not candidate:
            return []

        # Get all active jobs for the user
        from app.models.job import JobStatus
        from app.services.job_service import JobService

        job_service = JobService()
        jobs, _ = await job_service.get_jobs(
            user_id=candidate.user_id,
            status=JobStatus.ACTIVE,
            limit=100,  # Get more jobs for matching
        )

        matches = []
        for job in jobs:
            # Calculate match score
            match_score = await self.calculate_job_match_score(
                candidate_id, str(job.id)
            )
            if match_score:
                matches.append(
                    {
                        "job_id": str(job.id),
                        "job_title": job.title,
                        "job_location": job.location,
                        "score": match_score.score,
                        "match_details": match_score.match_details,
                    }
                )

        # Sort by score and return top matches
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:limit]

    async def get_candidate_stats(self, user_id: str) -> Dict:
        """
        Get candidate statistics for a user
        """
        total_candidates = await Candidate.find({"user_id": user_id}).count()
        new_candidates = await Candidate.find(
            {"user_id": user_id, "status": CandidateStatus.NEW}
        ).count()
        shortlisted = await Candidate.find(
            {"user_id": user_id, "status": CandidateStatus.SHORTLISTED}
        ).count()
        interviewed = await Candidate.find(
            {"user_id": user_id, "status": CandidateStatus.INTERVIEWED}
        ).count()
        hired = await Candidate.find(
            {"user_id": user_id, "status": CandidateStatus.HIRED}
        ).count()

        return {
            "total_candidates": total_candidates,
            "new_candidates": new_candidates,
            "shortlisted": shortlisted,
            "interviewed": interviewed,
            "hired": hired,
            "conversion_rate": (
                (hired / total_candidates * 100) if total_candidates > 0 else 0
            ),
        }
