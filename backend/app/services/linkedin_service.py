"""
LinkedIn Jobs API integration service
"""

import json
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from urllib.parse import urlencode

from app.core.config import settings

class LinkedInService:
    """Service for LinkedIn Jobs API integration"""
    
    def __init__(self):
        self.base_url = "https://api.linkedin.com/v2"
        self.auth_url = "https://www.linkedin.com/oauth/v2"
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.redirect_uri = settings.LINKEDIN_REDIRECT_URI or f"{settings.BACKEND_URL}/api/v1/linkedin/auth/callback"
        
        # Required scopes for job posting
        self.scopes = [
            "r_liteprofile",
            "r_emailaddress", 
            "w_member_social",
            "r_organization_social",
            "w_organization_social"
        ]
    
    def get_authorization_url(self, state: str) -> str:
        """
        Generate LinkedIn OAuth authorization URL
        """
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": " ".join(self.scopes)
        }
        
        return f"{self.auth_url}/authorization?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        """
        token_url = f"{self.auth_url}/accessToken"
        
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")
            
            return response.json()
    
    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """
        Get LinkedIn user profile information
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            # Get basic profile
            profile_response = await client.get(
                f"{self.base_url}/people/~",
                headers=headers
            )
            
            if profile_response.status_code != 200:
                raise Exception(f"Profile fetch failed: {profile_response.text}")
            
            # Get email address
            email_response = await client.get(
                f"{self.base_url}/emailAddress?q=members&projection=(elements*(handle~))",
                headers=headers
            )
            
            profile_data = profile_response.json()
            
            if email_response.status_code == 200:
                email_data = email_response.json()
                if email_data.get("elements"):
                    profile_data["email"] = email_data["elements"][0]["handle~"]["emailAddress"]
            
            return profile_data
    
    async def get_organizations(self, access_token: str) -> List[Dict[str, Any]]:
        """
        Get organizations the user can post jobs for
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/organizationAcls?q=roleAssignee",
                headers=headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Organizations fetch failed: {response.text}")
            
            data = response.json()
            organizations = []
            
            for element in data.get("elements", []):
                org_id = element.get("organization")
                if org_id:
                    # Get organization details
                    org_response = await client.get(
                        f"{self.base_url}/organizations/{org_id}",
                        headers=headers
                    )
                    
                    if org_response.status_code == 200:
                        org_data = org_response.json()
                        organizations.append({
                            "id": org_id,
                            "name": org_data.get("localizedName", "Unknown"),
                            "description": org_data.get("localizedDescription", ""),
                            "industry": org_data.get("localizedSpecialties", []),
                            "website": org_data.get("websiteUrl", ""),
                            "logo": org_data.get("logoV2", {}).get("original", "")
                        })
            
            return organizations
    
    async def post_job(
        self, 
        access_token: str, 
        organization_id: str, 
        job_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Post a job to LinkedIn
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        # Format job data for LinkedIn API
        linkedin_job = self._format_job_for_linkedin(job_data, organization_id)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/simpleJobPostings",
                headers=headers,
                json=linkedin_job
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Job posting failed: {response.text}")
            
            result = response.json()
            
            # Extract job ID from response
            job_id = result.get("id") or response.headers.get("x-restli-id")
            
            return {
                "external_job_id": job_id,
                "status": "posted",
                "platform": "linkedin",
                "posted_at": datetime.now(timezone.utc).isoformat(),
                "job_url": f"https://www.linkedin.com/jobs/view/{job_id}",
                "response": result
            }
    
    async def update_job(
        self, 
        access_token: str, 
        job_id: str, 
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing LinkedIn job posting
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.base_url}/simpleJobPostings/{job_id}",
                headers=headers,
                json=updates
            )
            
            if response.status_code != 200:
                raise Exception(f"Job update failed: {response.text}")
            
            return {
                "external_job_id": job_id,
                "status": "updated",
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "response": response.json()
            }
    
    async def delete_job(self, access_token: str, job_id: str) -> Dict[str, Any]:
        """
        Delete a LinkedIn job posting
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/simpleJobPostings/{job_id}",
                headers=headers
            )
            
            if response.status_code != 204:
                raise Exception(f"Job deletion failed: {response.text}")
            
            return {
                "external_job_id": job_id,
                "status": "deleted",
                "deleted_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def get_job_applications(
        self, 
        access_token: str, 
        job_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get applications for a LinkedIn job posting
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/simpleJobPostings/{job_id}/jobApplications",
                headers=headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Applications fetch failed: {response.text}")
            
            data = response.json()
            applications = []
            
            for element in data.get("elements", []):
                applications.append({
                    "application_id": element.get("id"),
                    "applicant_id": element.get("applicant"),
                    "applied_at": element.get("submittedAt"),
                    "status": element.get("applicationStatus"),
                    "cover_letter": element.get("coverLetter", ""),
                    "resume_url": element.get("resumeUrl", "")
                })
            
            return applications
    
    def _format_job_for_linkedin(self, job_data: Dict[str, Any], organization_id: str) -> Dict[str, Any]:
        """
        Format job data for LinkedIn API requirements
        """
        # Map job types
        job_type_mapping = {
            "full_time": "F",
            "part_time": "P", 
            "contract": "C",
            "temporary": "T",
            "internship": "I"
        }
        
        # Map experience levels
        experience_mapping = {
            "entry": "1",
            "mid": "2", 
            "senior": "3",
            "executive": "4"
        }
        
        linkedin_job = {
            "companyApplyUrl": job_data.get("apply_url", ""),
            "description": job_data.get("description", ""),
            "employmentStatus": job_type_mapping.get(job_data.get("job_type", "full_time"), "F"),
            "externalJobPostingId": job_data.get("external_id", ""),
            "jobFunction": {
                "code": self._get_job_function_code(job_data.get("title", ""))
            },
            "jobPostingOperationType": "CREATE",
            "listedAt": int(datetime.now(timezone.utc).timestamp() * 1000),
            "location": {
                "countryCode": job_data.get("country_code", "US"),
                "city": job_data.get("city", ""),
                "postalCode": job_data.get("postal_code", "")
            },
            "title": job_data.get("title", ""),
            "workplaceTypes": ["remote"] if job_data.get("remote_allowed") else ["onsite"]
        }
        
        # Add organization
        if organization_id:
            linkedin_job["integrationContext"] = organization_id
        
        # Add experience level if provided
        experience_level = experience_mapping.get(job_data.get("experience_level"))
        if experience_level:
            linkedin_job["experienceLevel"] = {"code": experience_level}
        
        # Add salary if provided
        if job_data.get("salary_min") or job_data.get("salary_max"):
            linkedin_job["compensation"] = {
                "baseSalary": {
                    "currencyCode": job_data.get("currency", "USD"),
                    "amount": {
                        "min": job_data.get("salary_min", 0),
                        "max": job_data.get("salary_max", 0)
                    }
                }
            }
        
        return linkedin_job
    
    def _get_job_function_code(self, job_title: str) -> str:
        """
        Map job title to LinkedIn job function code
        """
        title_lower = job_title.lower()
        
        if any(term in title_lower for term in ["engineer", "developer", "programmer", "architect"]):
            return "eng"
        elif any(term in title_lower for term in ["sales", "account", "business development"]):
            return "sal"
        elif any(term in title_lower for term in ["marketing", "brand", "content", "social media"]):
            return "mkt"
        elif any(term in title_lower for term in ["hr", "human resources", "recruiter", "talent"]):
            return "hum"
        elif any(term in title_lower for term in ["finance", "accounting", "controller", "analyst"]):
            return "fin"
        elif any(term in title_lower for term in ["operations", "logistics", "supply chain"]):
            return "ops"
        elif any(term in title_lower for term in ["design", "creative", "ux", "ui"]):
            return "des"
        elif any(term in title_lower for term in ["legal", "counsel", "attorney", "compliance"]):
            return "leg"
        elif any(term in title_lower for term in ["consulting", "strategy", "advisory"]):
            return "con"
        else:
            return "oth"  # Other
    
    async def validate_connection(self, access_token: str) -> Dict[str, Any]:
        """
        Validate LinkedIn API connection
        """
        try:
            profile = await self.get_user_profile(access_token)
            organizations = await self.get_organizations(access_token)
            
            return {
                "status": "valid",
                "profile": profile,
                "organizations": organizations,
                "validated_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                "status": "invalid",
                "error": str(e),
                "validated_at": datetime.now(timezone.utc).isoformat()
            }
