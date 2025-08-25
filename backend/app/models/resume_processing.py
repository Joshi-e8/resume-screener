"""
Optimized database models for resume processing
"""

from datetime import datetime
from typing import Optional, Dict, List, Any, Union
from beanie import Document, Indexed
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class ProcessingStatus(str, Enum):
    """Resume processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ProcessingMode(str, Enum):
    """Resume processing mode"""
    STANDARD = "standard"
    FAST = "fast"
    DETAILED = "detailed"


class ResumeMetadata(Document):
    """
    Fast lookup table for resume metadata
    Optimized for quick queries and status checks
    """
    
    # Core identification
    file_id: str = Field(..., description="Google Drive file ID or upload ID")
    filename: str = Field(..., description="Original filename")
    user_id: str = Field(..., description="User who uploaded the resume")
    
    # File information
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type of the file")
    file_hash: Optional[str] = Field(None, description="File hash for deduplication")
    
    # Processing information
    status: ProcessingStatus = Field(ProcessingStatus.PENDING, description="Processing status")
    processing_mode: ProcessingMode = Field(ProcessingMode.STANDARD, description="Processing mode used")
    task_id: Optional[str] = Field(None, description="Celery task ID")
    
    # Timing information
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processing_started_at: Optional[datetime] = Field(None)
    processing_completed_at: Optional[datetime] = Field(None)
    processing_time_ms: Optional[int] = Field(None, description="Total processing time in milliseconds")
    
    # Error information
    error_message: Optional[str] = Field(None, description="Error message if processing failed")
    retry_count: int = Field(0, description="Number of retry attempts")
    
    # Job association
    job_id: Optional[str] = Field(None, description="Associated job ID")
    
    # Quick access fields (extracted from detailed data)
    candidate_name: Optional[str] = Field(None, description="Candidate name for quick search")
    candidate_email: Optional[str] = Field(None, description="Candidate email for quick search")
    key_skills: List[str] = Field(default_factory=list, description="Top skills for quick filtering")

    @field_validator('candidate_email', mode='before')
    @classmethod
    def validate_candidate_email(cls, v):
        """Handle both string and list formats for candidate_email"""
        if v is None:
            return None
        if isinstance(v, list):
            # If it's a list, take the first email or return None if empty
            return v[0] if v else None
        return str(v) if v else None

    @field_validator('key_skills', mode='before')
    @classmethod
    def validate_key_skills(cls, v):
        """Ensure key_skills is always a list"""
        if v is None:
            return []
        if isinstance(v, str):
            # If it's a string, split by common delimiters
            return [skill.strip() for skill in v.replace(',', '|').replace(';', '|').split('|') if skill.strip()]
        if isinstance(v, list):
            return [str(skill).strip() for skill in v if skill]
        return []
    
    class Settings:
        name = "resume_metadata"
        indexes = [
            "user_id",
            "status",
            "created_at",
            "job_id",
            "file_id",
            [("user_id", 1), ("status", 1)],
            [("user_id", 1), ("created_at", -1)],
            [("job_id", 1), ("status", 1)],
            "candidate_email",
            "key_skills"
        ]


class ResumeDetails(Document):
    """
    Detailed resume data storage
    Separated from metadata for performance
    """
    
    # Reference to metadata
    resume_id: str = Field(..., description="Reference to ResumeMetadata._id")
    
    # Raw content
    raw_text: Optional[str] = Field(None, description="Extracted raw text")
    
    # Parsed structured data
    parsed_data: Dict[str, Any] = Field(default_factory=dict, description="Structured resume data")
    
    # Processing details
    extraction_method: Optional[str] = Field(None, description="Method used for text extraction")
    extraction_warnings: List[str] = Field(default_factory=list, description="Extraction warnings")
    
    # Analysis results
    analysis_results: Dict[str, Any] = Field(default_factory=dict, description="AI analysis results")
    matching_scores: Dict[str, float] = Field(default_factory=dict, description="Job matching scores")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "resume_details"
        indexes = [
            "resume_id",
            "created_at"
        ]


class BatchProcessingJob(Document):
    """
    Track batch processing jobs
    """
    
    # Job identification
    batch_id: str = Field(..., description="Unique batch identifier")
    user_id: str = Field(..., description="User who initiated the batch")
    
    # Job details
    total_files: int = Field(..., description="Total number of files in batch")
    processed_files: int = Field(0, description="Number of files processed")
    successful_files: int = Field(0, description="Number of successfully processed files")
    failed_files: int = Field(0, description="Number of failed files")
    
    # File tracking
    file_ids: List[str] = Field(default_factory=list, description="List of file IDs in batch")
    completed_file_ids: List[str] = Field(default_factory=list, description="Completed file IDs")
    failed_file_ids: List[str] = Field(default_factory=list, description="Failed file IDs")
    
    # Status and timing
    status: ProcessingStatus = Field(ProcessingStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = Field(None)
    completed_at: Optional[datetime] = Field(None)
    
    # Celery task tracking
    celery_task_id: Optional[str] = Field(None, description="Main Celery task ID")
    
    # Progress tracking
    progress_percentage: float = Field(0.0, description="Progress percentage (0-100)")
    current_status_message: str = Field("Pending", description="Current status message")
    
    # Results summary
    processing_summary: Dict[str, Any] = Field(default_factory=dict, description="Processing summary")
    
    class Settings:
        name = "batch_processing_jobs"
        indexes = [
            "user_id",
            "batch_id",
            "status",
            "created_at",
            [("user_id", 1), ("status", 1)],
            [("user_id", 1), ("created_at", -1)]
        ]


class ProcessingStats(Document):
    """
    Processing statistics for monitoring and optimization
    """
    
    # Time period
    date: datetime = Field(..., description="Date for these stats")
    hour: Optional[int] = Field(None, description="Hour (0-23) for hourly stats")
    
    # Volume stats
    total_files_processed: int = Field(0)
    successful_files: int = Field(0)
    failed_files: int = Field(0)
    
    # Performance stats
    avg_processing_time_ms: float = Field(0.0)
    max_processing_time_ms: int = Field(0)
    min_processing_time_ms: int = Field(0)
    
    # File type breakdown
    pdf_files: int = Field(0)
    docx_files: int = Field(0)
    doc_files: int = Field(0)
    txt_files: int = Field(0)
    
    # Processing mode breakdown
    standard_mode: int = Field(0)
    fast_mode: int = Field(0)
    detailed_mode: int = Field(0)
    
    # Error breakdown
    extraction_errors: int = Field(0)
    timeout_errors: int = Field(0)
    validation_errors: int = Field(0)
    other_errors: int = Field(0)
    
    class Settings:
        name = "processing_stats"
        indexes = [
            "date",
            [("date", 1), ("hour", 1)]
        ]


# Pydantic models for API responses
class ResumeMetadataResponse(BaseModel):
    """Response model for resume metadata"""
    id: str
    file_id: str
    filename: str
    status: ProcessingStatus
    processing_mode: ProcessingMode
    created_at: datetime
    processing_time_ms: Optional[int]
    candidate_name: Optional[str]
    candidate_email: Optional[str]
    key_skills: List[str]
    error_message: Optional[str]


class BatchJobResponse(BaseModel):
    """Response model for batch processing job"""
    batch_id: str
    total_files: int
    processed_files: int
    successful_files: int
    failed_files: int
    status: ProcessingStatus
    progress_percentage: float
    current_status_message: str
    created_at: datetime
    celery_task_id: Optional[str]


class ProcessingStatsResponse(BaseModel):
    """Response model for processing statistics"""
    date: datetime
    total_files_processed: int
    success_rate: float
    avg_processing_time_ms: float
    file_type_breakdown: Dict[str, int]
    processing_mode_breakdown: Dict[str, int]
    error_breakdown: Dict[str, int]
