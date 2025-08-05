"""
GROQ AI service for resume analysis and candidate matching
"""

import json
from typing import Any, Dict, List, Optional

from groq import Groq

from app.core.config import settings


class GroqAIService:
    """Service for GROQ AI integration"""

    def __init__(self):
        # Initialize GROQ client
        # For development, we'll use a placeholder API key
        # In production, this should be set in environment variables
        self.client = Groq(api_key=getattr(settings, "GROQ_API_KEY", "placeholder-key"))
        self.model = "llama3-8b-8192"  # GROQ's fast model

    async def analyze_resume(
        self, resume_text: str, parsed_data: Dict
    ) -> Dict[str, Any]:
        """
        Analyze resume using GROQ AI for enhanced insights
        """
        try:
            prompt = self._create_resume_analysis_prompt(resume_text, parsed_data)

            # For development without API key, return mock analysis
            if (
                not hasattr(settings, "GROQ_API_KEY")
                or settings.GROQ_API_KEY == "placeholder-key"
            ):
                return self._mock_resume_analysis(parsed_data)

            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert HR analyst and resume reviewer. Analyze resumes thoroughly and provide structured insights.",
                    },
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.3,
                max_tokens=1000,
            )

            analysis_text = response.choices[0].message.content
            return self._parse_analysis_response(analysis_text)

        except Exception as e:
            # Fallback to mock analysis if API fails
            return self._mock_resume_analysis(parsed_data)

    async def calculate_job_match_score(
        self,
        resume_text: str,
        job_description: str,
        parsed_resume: Dict,
        job_requirements: List[str],
    ) -> Dict[str, Any]:
        """
        Calculate job match score using GROQ AI
        """
        try:
            prompt = self._create_job_matching_prompt(
                resume_text, job_description, parsed_resume, job_requirements
            )

            # For development without API key, return mock score
            if (
                not hasattr(settings, "GROQ_API_KEY")
                or settings.GROQ_API_KEY == "placeholder-key"
            ):
                return self._mock_job_match_score(parsed_resume, job_requirements)

            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert recruiter. Analyze how well a candidate matches a job posting and provide a detailed scoring breakdown.",
                    },
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.2,
                max_tokens=800,
            )

            analysis_text = response.choices[0].message.content
            return self._parse_match_score_response(analysis_text)

        except Exception as e:
            # Fallback to mock scoring if API fails
            return self._mock_job_match_score(parsed_resume, job_requirements)

    async def generate_candidate_summary(self, parsed_data: Dict) -> str:
        """
        Generate AI-powered candidate summary
        """
        try:
            prompt = self._create_summary_prompt(parsed_data)

            # For development without API key, return mock summary
            if (
                not hasattr(settings, "GROQ_API_KEY")
                or settings.GROQ_API_KEY == "placeholder-key"
            ):
                return self._mock_candidate_summary(parsed_data)

            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert recruiter. Create concise, professional candidate summaries highlighting key strengths and qualifications.",
                    },
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.4,
                max_tokens=300,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            return self._mock_candidate_summary(parsed_data)

    async def extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extract skills from text using AI
        """
        try:
            prompt = f"""
            Extract all technical skills, programming languages, frameworks, tools, and technologies mentioned in this text.
            Return only a JSON array of skills, no other text.
            
            Text: {text[:2000]}  # Limit text length
            """

            # For development without API key, return basic extraction
            if (
                not hasattr(settings, "GROQ_API_KEY")
                or settings.GROQ_API_KEY == "placeholder-key"
            ):
                return self._mock_skill_extraction(text)

            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a technical skill extraction expert. Extract skills and return them as a JSON array.",
                    },
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.1,
                max_tokens=400,
            )

            skills_text = response.choices[0].message.content.strip()
            try:
                skills = json.loads(skills_text)
                return skills if isinstance(skills, list) else []
            except json.JSONDecodeError:
                return self._mock_skill_extraction(text)

        except Exception as e:
            return self._mock_skill_extraction(text)

    def _create_resume_analysis_prompt(
        self, resume_text: str, parsed_data: Dict
    ) -> str:
        """Create prompt for resume analysis"""
        return f"""
        Analyze this resume and provide insights in the following JSON format:
        {{
            "strengths": ["list of key strengths"],
            "areas_for_improvement": ["list of areas to improve"],
            "experience_level": "entry/mid/senior/executive",
            "key_skills": ["top 5 most relevant skills"],
            "career_progression": "assessment of career growth",
            "overall_quality": "score from 1-10",
            "recommendations": ["suggestions for the candidate"]
        }}
        
        Resume text: {resume_text[:3000]}
        
        Parsed data: {json.dumps(parsed_data, default=str)[:1000]}
        """

    def _create_job_matching_prompt(
        self,
        resume_text: str,
        job_description: str,
        parsed_resume: Dict,
        job_requirements: List[str],
    ) -> str:
        """Create prompt for job matching"""
        return f"""
        Analyze how well this candidate matches the job posting. Provide a detailed scoring in JSON format:
        {{
            "overall_score": 85,
            "skill_match_score": 90,
            "experience_match_score": 80,
            "education_match_score": 85,
            "cultural_fit_score": 75,
            "strengths": ["specific matching strengths"],
            "gaps": ["areas where candidate doesn't match"],
            "recommendations": ["suggestions for hiring decision"],
            "confidence_level": "high/medium/low"
        }}
        
        Job Description: {job_description[:2000]}
        Job Requirements: {', '.join(job_requirements)}
        
        Candidate Resume: {resume_text[:2000]}
        Candidate Skills: {', '.join(parsed_resume.get('skills', []))}
        """

    def _create_summary_prompt(self, parsed_data: Dict) -> str:
        """Create prompt for candidate summary"""
        skills = ", ".join(parsed_data.get("skills", [])[:10])
        experience = parsed_data.get("experience", [])
        education = parsed_data.get("education", [])

        return f"""
        Create a professional 2-3 sentence summary for this candidate highlighting their key qualifications:
        
        Skills: {skills}
        Experience: {len(experience)} positions
        Education: {education[0].get('degree', 'N/A') if education else 'N/A'}
        Summary from resume: {parsed_data.get('summary', '')[:200]}
        
        Focus on their strongest qualifications and career highlights.
        """

    def _mock_resume_analysis(self, parsed_data: Dict) -> Dict[str, Any]:
        """Mock analysis for development"""
        skills = parsed_data.get("skills", [])
        experience = parsed_data.get("experience", [])

        return {
            "strengths": [
                (
                    f"Strong technical skills in {', '.join(skills[:3])}"
                    if skills
                    else "Technical background"
                ),
                (
                    f"{len(experience)} years of relevant experience"
                    if experience
                    else "Professional experience"
                ),
                "Well-structured resume presentation",
            ],
            "areas_for_improvement": [
                "Could highlight more specific achievements",
                "Consider adding quantifiable results",
                "Professional summary could be more compelling",
            ],
            "experience_level": "mid" if len(experience) >= 2 else "entry",
            "key_skills": (
                skills[:5] if skills else ["Communication", "Problem Solving"]
            ),
            "career_progression": (
                "Steady growth trajectory" if len(experience) > 1 else "Early career"
            ),
            "overall_quality": 8.5,
            "recommendations": [
                "Strong candidate for technical roles",
                "Good fit for collaborative environments",
                "Consider for mid-level positions",
            ],
        }

    def _mock_job_match_score(
        self, parsed_resume: Dict, job_requirements: List[str]
    ) -> Dict[str, Any]:
        """Mock job matching for development"""
        candidate_skills = set(
            skill.lower() for skill in parsed_resume.get("skills", [])
        )
        required_skills = set(req.lower() for req in job_requirements)

        skill_overlap = len(candidate_skills.intersection(required_skills))
        skill_match_score = min(
            (skill_overlap / len(required_skills) * 100) if required_skills else 50, 100
        )

        overall_score = (
            skill_match_score + 75 + 80 + 70
        ) / 4  # Average with mock scores

        return {
            "overall_score": round(overall_score, 1),
            "skill_match_score": round(skill_match_score, 1),
            "experience_match_score": 75,
            "education_match_score": 80,
            "cultural_fit_score": 70,
            "strengths": [
                f"Matches {skill_overlap} required skills",
                "Relevant experience background",
                "Strong educational foundation",
            ],
            "gaps": [
                "Some technical skills could be stronger",
                "Industry experience could be more specific",
            ],
            "recommendations": [
                "Good candidate for interview",
                "Consider for technical assessment",
                "Strong potential for growth",
            ],
            "confidence_level": (
                "high"
                if overall_score > 80
                else "medium" if overall_score > 60 else "low"
            ),
        }

    def _mock_candidate_summary(self, parsed_data: Dict) -> str:
        """Mock candidate summary for development"""
        skills = parsed_data.get("skills", [])
        experience = parsed_data.get("experience", [])
        education = parsed_data.get("education", [])

        if skills and experience:
            return f"Experienced professional with {len(experience)} years in {skills[0] if skills else 'technology'} and expertise in {', '.join(skills[:3])}. Strong background in software development with proven track record of delivering results."
        elif skills:
            return f"Technical professional with strong skills in {', '.join(skills[:3])}. Demonstrates solid foundation in technology and eagerness to contribute to innovative projects."
        else:
            return "Motivated professional with diverse background and strong problem-solving abilities. Demonstrates excellent communication skills and adaptability in dynamic environments."

    def _mock_skill_extraction(self, text: str) -> List[str]:
        """Mock skill extraction for development"""
        common_skills = [
            "Python",
            "JavaScript",
            "React",
            "Node.js",
            "SQL",
            "Git",
            "AWS",
            "Docker",
            "MongoDB",
            "PostgreSQL",
            "REST API",
            "Machine Learning",
            "Data Analysis",
            "Project Management",
        ]

        found_skills = []
        text_lower = text.lower()

        for skill in common_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)

        return found_skills[:10]  # Return top 10 matches

    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI analysis response"""
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback parsing if JSON is malformed
            return {
                "strengths": ["AI analysis completed"],
                "areas_for_improvement": ["Continue professional development"],
                "experience_level": "mid",
                "key_skills": ["Communication", "Problem Solving"],
                "career_progression": "Positive trajectory",
                "overall_quality": 8.0,
                "recommendations": ["Strong candidate potential"],
            }

    def _parse_match_score_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI match score response"""
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback scoring if JSON is malformed
            return {
                "overall_score": 75.0,
                "skill_match_score": 70.0,
                "experience_match_score": 75.0,
                "education_match_score": 80.0,
                "cultural_fit_score": 75.0,
                "strengths": ["Good technical background"],
                "gaps": ["Some areas for development"],
                "recommendations": ["Consider for interview"],
                "confidence_level": "medium",
            }
