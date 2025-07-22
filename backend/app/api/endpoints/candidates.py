"""
Candidate management endpoints
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.user import User
from app.models.candidate import Candidate, CandidateCreate, CandidateUpdate, CandidateResponse, CandidateSearchFilters
from app.services.candidate_service import CandidateService

router = APIRouter()

class CandidateListResponse(BaseModel):
    candidates: List[CandidateResponse]
    total: int
    page: int
    size: int

# CandidateSearchFilters moved to models/candidate.py

@router.get("/", response_model=CandidateListResponse)
async def get_candidates(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    skills: str = Query(None, description="Comma-separated skills"),
    experience_min: int = Query(None, ge=0),
    experience_max: int = Query(None, ge=0),
    location: str = Query(None),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get candidates with filtering and pagination
    """
    candidate_service = CandidateService()
    
    # Parse skills filter
    skills_list = None
    if skills:
        skills_list = [skill.strip() for skill in skills.split(",")]
    
    filters = CandidateSearchFilters(
        skills=skills_list,
        experience_min=experience_min,
        experience_max=experience_max,
        location=location
    )
    
    candidates, total = await candidate_service.get_candidates(
        skip=(page - 1) * size,
        limit=size,
        search=search,
        filters=filters,
        user_id=str(current_user.id)
    )
    
    return CandidateListResponse(
        candidates=[CandidateResponse.from_orm(candidate) for candidate in candidates],
        total=total,
        page=page,
        size=size
    )

@router.post("/", response_model=CandidateResponse)
async def create_candidate(
    candidate_data: CandidateCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create new candidate
    """
    candidate_service = CandidateService()
    
    # Add user_id to candidate data
    candidate_data.user_id = str(current_user.id)
    
    candidate = await candidate_service.create_candidate(candidate_data)
    return CandidateResponse.from_orm(candidate)

@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get candidate by ID
    """
    candidate_service = CandidateService()
    
    candidate = await candidate_service.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if user has access to this candidate
    if candidate.user_id != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return CandidateResponse.from_orm(candidate)

@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: str,
    candidate_data: CandidateUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update candidate
    """
    candidate_service = CandidateService()
    
    candidate = await candidate_service.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if user has access to this candidate
    if candidate.user_id != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    updated_candidate = await candidate_service.update_candidate(candidate_id, candidate_data)
    return CandidateResponse.from_orm(updated_candidate)

@router.delete("/{candidate_id}")
async def delete_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete candidate
    """
    candidate_service = CandidateService()
    
    candidate = await candidate_service.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if user has access to this candidate
    if candidate.user_id != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    await candidate_service.delete_candidate(candidate_id)
    return {"message": "Candidate deleted successfully"}

@router.post("/{candidate_id}/score")
async def score_candidate_for_job(
    candidate_id: str,
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Calculate AI score for candidate against specific job
    """
    candidate_service = CandidateService()
    
    candidate = await candidate_service.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if user has access to this candidate
    if candidate.user_id != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    score = await candidate_service.calculate_job_match_score(candidate_id, job_id)
    return {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "score": score.score,
        "match_details": score.details,
        "recommendations": score.recommendations
    }

@router.get("/{candidate_id}/matches")
async def get_candidate_job_matches(
    candidate_id: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get best job matches for candidate
    """
    candidate_service = CandidateService()
    
    candidate = await candidate_service.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if user has access to this candidate
    if candidate.user_id != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    matches = await candidate_service.find_job_matches(candidate_id, limit)
    return {
        "candidate_id": candidate_id,
        "matches": matches
    }
