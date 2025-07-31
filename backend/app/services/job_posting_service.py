"""
Job posting service for multi-platform job distribution
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class JobPostingService:
    """Service for posting jobs to multiple platforms"""
    
    def __init__(self):
        self.supported_platforms = ["linkedin", "indeed", "glassdoor", "ziprecruiter"]
    
    async def post_job_to_platform(
        self, 
        user_id: str, 
        job_id: str, 
        platform_id: str, 
        job_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Post a job to a specific platform
        """
        if platform_id not in self.supported_platforms:
            return {
                "status": "error",
                "message": f"Platform {platform_id} not supported",
                "platform_id": platform_id
            }
        
        # Mock job posting process
        # In real implementation, this would:
        # 1. Format job data for platform-specific API
        # 2. Make API call to post job
        # 3. Handle platform-specific responses
        # 4. Store external job ID for tracking
        
        external_job_id = f"{platform_id}_{job_id}_{int(datetime.now(timezone.utc).timestamp())}"
        
        return {
            "status": "success",
            "platform_id": platform_id,
            "external_job_id": external_job_id,
            "job_url": f"https://{platform_id}.com/jobs/{external_job_id}",
            "posted_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": None,  # Platform-specific
            "cost": self._calculate_posting_cost(platform_id, job_data),
            "estimated_reach": self._estimate_reach(platform_id, job_data)
        }
    
    async def post_job_to_multiple_platforms(
        self, 
        user_id: str, 
        job_id: str, 
        platforms: List[str], 
        job_data: Dict[str, Any]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Post a job to multiple platforms simultaneously
        """
        results = {
            "successful": [],
            "failed": []
        }
        
        for platform_id in platforms:
            try:
                result = await self.post_job_to_platform(user_id, job_id, platform_id, job_data)
                
                if result["status"] == "success":
                    results["successful"].append(result)
                else:
                    results["failed"].append(result)
                    
            except Exception as e:
                results["failed"].append({
                    "status": "error",
                    "platform_id": platform_id,
                    "message": str(e)
                })
        
        return results
    
    async def update_job_on_platform(
        self, 
        user_id: str, 
        job_id: str, 
        platform_id: str, 
        external_job_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing job posting on a platform
        """
        if platform_id not in self.supported_platforms:
            return {
                "status": "error",
                "message": f"Platform {platform_id} not supported"
            }
        
        # Mock job update process
        return {
            "status": "success",
            "platform_id": platform_id,
            "external_job_id": external_job_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_fields": list(updates.keys())
        }
    
    async def remove_job_from_platform(
        self, 
        user_id: str, 
        platform_id: str, 
        external_job_id: str
    ) -> Dict[str, Any]:
        """
        Remove a job posting from a platform
        """
        if platform_id not in self.supported_platforms:
            return {
                "status": "error",
                "message": f"Platform {platform_id} not supported"
            }
        
        # Mock job removal process
        return {
            "status": "success",
            "platform_id": platform_id,
            "external_job_id": external_job_id,
            "removed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_job_performance(
        self, 
        user_id: str, 
        job_id: str, 
        platform_id: str = None
    ) -> Dict[str, Any]:
        """
        Get performance metrics for a job across platforms
        """
        # Mock performance data
        if platform_id:
            # Single platform performance
            return {
                "job_id": job_id,
                "platform_id": platform_id,
                "metrics": {
                    "views": 245,
                    "applications": 18,
                    "application_rate": 7.3,
                    "cost_to_date": 125.50,
                    "cost_per_application": 6.97
                },
                "trends": {
                    "views_7d": "+15%",
                    "applications_7d": "+22%"
                }
            }
        else:
            # Multi-platform performance
            return {
                "job_id": job_id,
                "total_metrics": {
                    "total_views": 892,
                    "total_applications": 67,
                    "average_application_rate": 7.5,
                    "total_cost": 445.75,
                    "average_cost_per_application": 6.65
                },
                "platform_breakdown": [
                    {
                        "platform_id": "linkedin",
                        "views": 345,
                        "applications": 28,
                        "cost": 180.25
                    },
                    {
                        "platform_id": "indeed",
                        "views": 298,
                        "applications": 22,
                        "cost": 145.50
                    },
                    {
                        "platform_id": "glassdoor",
                        "views": 249,
                        "applications": 17,
                        "cost": 120.00
                    }
                ]
            }
    
    async def sync_applications(
        self, 
        user_id: str, 
        job_id: str, 
        platform_id: str
    ) -> Dict[str, Any]:
        """
        Sync applications from a platform
        """
        if platform_id not in self.supported_platforms:
            return {
                "status": "error",
                "message": f"Platform {platform_id} not supported"
            }
        
        # Mock application sync
        return {
            "status": "success",
            "platform_id": platform_id,
            "job_id": job_id,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "new_applications": 5,
            "updated_applications": 2,
            "total_applications": 23
        }
    
    def _calculate_posting_cost(self, platform_id: str, job_data: Dict[str, Any]) -> float:
        """
        Calculate estimated posting cost for a platform
        """
        base_costs = {
            "linkedin": 150.0,
            "indeed": 100.0,
            "glassdoor": 120.0,
            "ziprecruiter": 80.0
        }
        
        base_cost = base_costs.get(platform_id, 100.0)
        
        # Adjust based on job data
        if job_data.get("urgent", False):
            base_cost *= 1.5
        
        if job_data.get("featured", False):
            base_cost *= 1.3
        
        return round(base_cost, 2)
    
    def _estimate_reach(self, platform_id: str, job_data: Dict[str, Any]) -> int:
        """
        Estimate potential reach for a job posting
        """
        base_reach = {
            "linkedin": 5000,
            "indeed": 8000,
            "glassdoor": 3500,
            "ziprecruiter": 4500
        }
        
        reach = base_reach.get(platform_id, 3000)
        
        # Adjust based on job data
        if job_data.get("remote_allowed", False):
            reach *= 2
        
        if job_data.get("urgent", False):
            reach = int(reach * 1.2)
        
        return reach
    
    async def get_posting_recommendations(
        self, 
        user_id: str, 
        job_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Get platform recommendations for a job posting
        """
        recommendations = []
        
        for platform_id in self.supported_platforms:
            score = self._calculate_platform_score(platform_id, job_data)
            cost = self._calculate_posting_cost(platform_id, job_data)
            reach = self._estimate_reach(platform_id, job_data)
            
            recommendations.append({
                "platform_id": platform_id,
                "recommendation_score": score,
                "estimated_cost": cost,
                "estimated_reach": reach,
                "cost_per_reach": round(cost / reach * 1000, 2),  # Cost per 1000 views
                "reasons": self._get_recommendation_reasons(platform_id, job_data, score)
            })
        
        # Sort by recommendation score
        recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
        
        return recommendations
    
    def _calculate_platform_score(self, platform_id: str, job_data: Dict[str, Any]) -> float:
        """
        Calculate recommendation score for a platform
        """
        base_scores = {
            "linkedin": 8.5,
            "indeed": 8.0,
            "glassdoor": 7.5,
            "ziprecruiter": 7.0
        }
        
        score = base_scores.get(platform_id, 7.0)
        
        # Adjust based on job characteristics
        job_title = job_data.get("title", "").lower()
        
        if "senior" in job_title or "lead" in job_title:
            if platform_id == "linkedin":
                score += 1.0
        
        if "remote" in job_data.get("location", "").lower():
            if platform_id in ["indeed", "ziprecruiter"]:
                score += 0.5
        
        return min(score, 10.0)
    
    def _get_recommendation_reasons(
        self, 
        platform_id: str, 
        job_data: Dict[str, Any], 
        score: float
    ) -> List[str]:
        """
        Get reasons for platform recommendation
        """
        reasons = []
        
        if score >= 9.0:
            reasons.append("Excellent match for this job type")
        elif score >= 8.0:
            reasons.append("Good platform for this position")
        elif score >= 7.0:
            reasons.append("Decent reach for this role")
        else:
            reasons.append("Consider for broader reach")
        
        # Platform-specific reasons
        platform_reasons = {
            "linkedin": ["Professional network", "High-quality candidates"],
            "indeed": ["Large candidate pool", "Cost-effective"],
            "glassdoor": ["Company branding opportunity", "Salary transparency"],
            "ziprecruiter": ["AI-powered matching", "Mobile-first audience"]
        }
        
        reasons.extend(platform_reasons.get(platform_id, []))
        
        return reasons
