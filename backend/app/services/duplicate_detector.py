"""
Duplicate resume detection service
"""

import hashlib
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from loguru import logger

from app.models.resume_processing import ResumeMetadata


class DuplicateDetector:
    """Service for detecting duplicate resumes"""
    
    @staticmethod
    def calculate_file_hash(file_content: bytes) -> str:
        """Calculate SHA-256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()
    
    @staticmethod
    def calculate_file_hash_from_path(file_path: str) -> str:
        """Calculate SHA-256 hash from file path"""
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    
    @staticmethod
    async def find_duplicate_by_hash(file_hash: str, user_id: str) -> Optional[ResumeMetadata]:
        """Find existing resume with the same hash for the same user"""
        try:
            duplicate = await ResumeMetadata.find_one({
                "file_hash": file_hash,
                "user_id": user_id
            })
            return duplicate
        except Exception as e:
            logger.error(f"Error finding duplicate by hash: {e}")
            return None
    
    @staticmethod
    async def find_duplicates_by_email(email: str, user_id: str) -> List[ResumeMetadata]:
        """Find existing resumes with the same candidate email for the same user"""
        try:
            if not email:
                return []
            
            duplicates = await ResumeMetadata.find({
                "candidate_email": email,
                "user_id": user_id
            }).to_list()
            return duplicates
        except Exception as e:
            logger.error(f"Error finding duplicates by email: {e}")
            return []
    
    @staticmethod
    async def find_duplicates_by_name_and_email(name: str, email: str, user_id: str) -> List[ResumeMetadata]:
        """Find existing resumes with the same candidate name and email for the same user"""
        try:
            if not name and not email:
                return []
            
            query = {"user_id": user_id}
            
            # Build query based on available data
            if name and email:
                query["$and"] = [
                    {"candidate_name": {"$regex": name, "$options": "i"}},
                    {"candidate_email": email}
                ]
            elif email:
                query["candidate_email"] = email
            elif name:
                query["candidate_name"] = {"$regex": name, "$options": "i"}
            
            duplicates = await ResumeMetadata.find(query).to_list()
            return duplicates
        except Exception as e:
            logger.error(f"Error finding duplicates by name and email: {e}")
            return []
    
    @staticmethod
    async def check_for_duplicates(
        file_hash: str,
        candidate_name: Optional[str] = None,
        candidate_email: Optional[str] = None,
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Comprehensive duplicate check
        Returns information about potential duplicates
        """
        result = {
            "has_duplicates": False,
            "duplicate_types": [],
            "exact_duplicate": None,
            "similar_duplicates": []
        }
        
        try:
            # Check for exact file hash duplicate
            exact_duplicate = await DuplicateDetector.find_duplicate_by_hash(file_hash, user_id)
            if exact_duplicate:
                result["has_duplicates"] = True
                result["duplicate_types"].append("exact_file")
                result["exact_duplicate"] = {
                    "id": str(exact_duplicate.id),
                    "filename": exact_duplicate.filename,
                    "candidate_name": exact_duplicate.candidate_name,
                    "candidate_email": exact_duplicate.candidate_email,
                    "created_at": exact_duplicate.created_at.isoformat(),
                    "duplicate_type": "exact_file"
                }
            
            # Check for similar duplicates by email/name (only if no exact duplicate)
            if not exact_duplicate and (candidate_name or candidate_email):
                similar_duplicates = await DuplicateDetector.find_duplicates_by_name_and_email(
                    candidate_name, candidate_email, user_id
                )
                
                if similar_duplicates:
                    result["has_duplicates"] = True
                    result["duplicate_types"].append("similar_candidate")
                    result["similar_duplicates"] = [
                        {
                            "id": str(dup.id),
                            "filename": dup.filename,
                            "candidate_name": dup.candidate_name,
                            "candidate_email": dup.candidate_email,
                            "created_at": dup.created_at.isoformat(),
                            "duplicate_type": "similar_candidate"
                        }
                        for dup in similar_duplicates
                    ]
            
            return result
            
        except Exception as e:
            logger.error(f"Error in comprehensive duplicate check: {e}")
            return result
    
    @staticmethod
    async def mark_as_duplicate(resume_id: str, original_resume_id: str, duplicate_type: str = "exact_file"):
        """Mark a resume as duplicate of another"""
        try:
            resume = await ResumeMetadata.get(resume_id)
            if resume:
                # Add duplicate information to the resume metadata
                if not hasattr(resume, 'duplicate_info'):
                    resume.duplicate_info = {}
                
                resume.duplicate_info = {
                    "is_duplicate": True,
                    "original_resume_id": original_resume_id,
                    "duplicate_type": duplicate_type,
                    "marked_at": datetime.utcnow().isoformat()
                }
                await resume.save()
                logger.info(f"Marked resume {resume_id} as duplicate of {original_resume_id}")
                
        except Exception as e:
            logger.error(f"Error marking resume as duplicate: {e}")
    
    @staticmethod
    async def get_duplicate_groups(user_id: str) -> List[Dict[str, Any]]:
        """Get all duplicate groups for a user"""
        try:
            # Find all resumes with duplicates
            resumes_with_hashes = await ResumeMetadata.find({
                "user_id": user_id,
                "file_hash": {"$ne": None}
            }).to_list()
            
            # Group by hash
            hash_groups = {}
            for resume in resumes_with_hashes:
                hash_val = resume.file_hash
                if hash_val not in hash_groups:
                    hash_groups[hash_val] = []
                hash_groups[hash_val].append(resume)
            
            # Filter groups with more than one resume
            duplicate_groups = []
            for hash_val, resumes in hash_groups.items():
                if len(resumes) > 1:
                    # Sort by creation date (oldest first)
                    resumes.sort(key=lambda x: x.created_at)
                    
                    duplicate_groups.append({
                        "hash": hash_val,
                        "count": len(resumes),
                        "original": {
                            "id": str(resumes[0].id),
                            "filename": resumes[0].filename,
                            "candidate_name": resumes[0].candidate_name,
                            "candidate_email": resumes[0].candidate_email,
                            "created_at": resumes[0].created_at.isoformat()
                        },
                        "duplicates": [
                            {
                                "id": str(resume.id),
                                "filename": resume.filename,
                                "candidate_name": resume.candidate_name,
                                "candidate_email": resume.candidate_email,
                                "created_at": resume.created_at.isoformat()
                            }
                            for resume in resumes[1:]
                        ]
                    })
            
            return duplicate_groups
            
        except Exception as e:
            logger.error(f"Error getting duplicate groups: {e}")
            return []
