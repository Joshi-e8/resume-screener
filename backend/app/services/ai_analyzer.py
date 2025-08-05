"""
AI analyzer service that combines resume parsing with GROQ AI analysis
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.services.groq_ai_service import GroqAIService
from app.services.resume_parser import ResumeParser


class AIAnalyzer:
    """Enhanced AI analyzer combining parsing and AI insights"""

    def __init__(self):
        self.groq_service = GroqAIService()
        self.resume_parser = ResumeParser()

    async def analyze_resume_comprehensive(
        self, file_path: str, job_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive resume analysis combining parsing and AI insights
        """
        # Step 1: Parse resume structure
        parsed_data = await self.resume_parser.parse_resume(file_path)

        # Step 2: Get AI analysis
        ai_analysis = await self.groq_service.analyze_resume(
            parsed_data.get("raw_text", ""), parsed_data
        )

        # Step 3: Generate AI summary
        ai_summary = await self.groq_service.generate_candidate_summary(parsed_data)

        # Step 4: Enhanced skill extraction
        enhanced_skills = await self.groq_service.extract_skills_from_text(
            parsed_data.get("raw_text", "")
        )

        # Combine all skills (parsed + AI extracted)
        all_skills = list(set(parsed_data.get("skills", []) + enhanced_skills))

        # Step 5: Job matching if job context provided
        job_match = None
        if job_context:
            job_match = await self.calculate_job_compatibility(parsed_data, job_context)

        # Combine all analysis
        comprehensive_analysis = {
            "parsed_data": parsed_data,
            "ai_analysis": ai_analysis,
            "ai_summary": ai_summary,
            "enhanced_skills": all_skills,
            "job_match": job_match,
            "analysis_metadata": {
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "analysis_version": "1.0",
                "confidence_score": ai_analysis.get("overall_quality", 8.0),
            },
        }

        return comprehensive_analysis

    async def calculate_job_compatibility(
        self, parsed_resume: Dict, job_context: Dict
    ) -> Dict[str, Any]:
        """
        Calculate how well a resume matches a job
        """
        job_description = job_context.get("description", "")
        job_requirements = job_context.get("requirements", [])
        job_skills = job_context.get("skills", [])

        # Get AI-powered job match score
        match_analysis = await self.groq_service.calculate_job_match_score(
            resume_text=parsed_resume.get("raw_text", ""),
            job_description=job_description,
            parsed_resume=parsed_resume,
            job_requirements=job_requirements + job_skills,
        )

        # Add additional compatibility metrics
        compatibility_metrics = self._calculate_compatibility_metrics(
            parsed_resume, job_context
        )

        # Combine AI analysis with rule-based metrics
        final_score = self._combine_scores(match_analysis, compatibility_metrics)

        return {
            "ai_analysis": match_analysis,
            "compatibility_metrics": compatibility_metrics,
            "final_score": final_score,
            "recommendation": self._generate_recommendation(final_score),
            "calculated_at": datetime.now(timezone.utc).isoformat(),
        }

    def _calculate_compatibility_metrics(
        self, parsed_resume: Dict, job_context: Dict
    ) -> Dict[str, Any]:
        """
        Calculate rule-based compatibility metrics
        """
        # Skill matching
        candidate_skills = set(
            skill.lower() for skill in parsed_resume.get("skills", [])
        )
        required_skills = set(skill.lower() for skill in job_context.get("skills", []))

        skill_match_count = len(candidate_skills.intersection(required_skills))
        skill_match_percentage = (
            (skill_match_count / len(required_skills) * 100) if required_skills else 0
        )

        # Experience level matching
        candidate_experience = len(parsed_resume.get("experience", []))
        required_experience = job_context.get("experience_level", "mid")

        experience_match = self._match_experience_level(
            candidate_experience, required_experience
        )

        # Education matching
        candidate_education = parsed_resume.get("education", [])
        required_education = job_context.get("education_level", "")

        education_match = self._match_education_level(
            candidate_education, required_education
        )

        # Location matching
        candidate_location = parsed_resume.get("contact_info", {}).get("location", "")
        job_location = job_context.get("location", "")
        remote_allowed = job_context.get("remote_allowed", False)

        location_match = self._match_location(
            candidate_location, job_location, remote_allowed
        )

        return {
            "skill_match": {
                "matched_skills": skill_match_count,
                "total_required": len(required_skills),
                "percentage": round(skill_match_percentage, 1),
            },
            "experience_match": experience_match,
            "education_match": education_match,
            "location_match": location_match,
            "overall_compatibility": round(
                (
                    skill_match_percentage
                    + experience_match
                    + education_match
                    + location_match
                )
                / 4,
                1,
            ),
        }

    def _match_experience_level(
        self, candidate_years: int, required_level: str
    ) -> float:
        """Match experience level"""
        level_mapping = {
            "entry": (0, 2),
            "mid": (2, 5),
            "senior": (5, 10),
            "executive": (10, float("inf")),
        }

        if required_level not in level_mapping:
            return 50.0  # Default score

        min_years, max_years = level_mapping[required_level]

        if min_years <= candidate_years <= max_years:
            return 100.0
        elif candidate_years < min_years:
            # Under-qualified
            gap = min_years - candidate_years
            return max(50.0 - (gap * 10), 0)
        else:
            # Over-qualified
            excess = candidate_years - max_years
            return max(90.0 - (excess * 5), 60)

    def _match_education_level(
        self, candidate_education: List[Dict], required_level: str
    ) -> float:
        """Match education level"""
        if not required_level:
            return 75.0  # Default if no requirement

        if not candidate_education:
            return 30.0  # Low score if no education info

        education_levels = {
            "high_school": 1,
            "associate": 2,
            "bachelor": 3,
            "master": 4,
            "doctorate": 5,
        }

        # Find highest education level
        candidate_level = 0
        for edu in candidate_education:
            degree = edu.get("degree", "").lower()
            for level, value in education_levels.items():
                if level in degree or level.replace("_", " ") in degree:
                    candidate_level = max(candidate_level, value)

        required_value = education_levels.get(required_level.lower(), 3)

        if candidate_level >= required_value:
            return 100.0
        elif candidate_level == required_value - 1:
            return 80.0
        else:
            return 50.0

    def _match_location(
        self, candidate_location: str, job_location: str, remote_allowed: bool
    ) -> float:
        """Match location requirements"""
        if remote_allowed:
            return 100.0  # Perfect match if remote allowed

        if not candidate_location or not job_location:
            return 60.0  # Neutral if location info missing

        candidate_lower = candidate_location.lower()
        job_lower = job_location.lower()

        # Exact match
        if candidate_lower == job_lower:
            return 100.0

        # City match
        if any(city in candidate_lower for city in job_lower.split(",")):
            return 90.0

        # State match
        if len(job_lower.split(",")) > 1:
            job_state = job_lower.split(",")[-1].strip()
            if job_state in candidate_lower:
                return 70.0

        return 30.0  # No match

    def _combine_scores(
        self, ai_analysis: Dict, compatibility_metrics: Dict
    ) -> Dict[str, float]:
        """Combine AI and rule-based scores"""
        ai_score = ai_analysis.get("overall_score", 75.0)
        compatibility_score = compatibility_metrics.get("overall_compatibility", 75.0)

        # Weighted combination (60% AI, 40% rule-based)
        final_score = (ai_score * 0.6) + (compatibility_score * 0.4)

        return {
            "ai_score": round(ai_score, 1),
            "compatibility_score": round(compatibility_score, 1),
            "final_score": round(final_score, 1),
            "confidence": ai_analysis.get("confidence_level", "medium"),
        }

    def _generate_recommendation(self, score_data: Dict) -> Dict[str, Any]:
        """Generate hiring recommendation based on scores"""
        final_score = score_data.get("final_score", 0)
        confidence = score_data.get("confidence", "medium")

        if final_score >= 85:
            recommendation = "strong_match"
            action = "Highly recommend for interview"
            priority = "high"
        elif final_score >= 70:
            recommendation = "good_match"
            action = "Recommend for interview"
            priority = "medium"
        elif final_score >= 55:
            recommendation = "potential_match"
            action = "Consider for interview with reservations"
            priority = "low"
        else:
            recommendation = "poor_match"
            action = "Not recommended for this position"
            priority = "none"

        return {
            "recommendation": recommendation,
            "action": action,
            "priority": priority,
            "confidence": confidence,
            "score": final_score,
        }

    async def batch_analyze_resumes(
        self, file_paths: List[str], job_context: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze multiple resumes in batch
        """
        results = []

        for file_path in file_paths:
            try:
                analysis = await self.analyze_resume_comprehensive(
                    file_path, job_context
                )
                analysis["status"] = "success"
                results.append(analysis)
            except Exception as e:
                results.append(
                    {"file_path": file_path, "status": "error", "error": str(e)}
                )

        return results
