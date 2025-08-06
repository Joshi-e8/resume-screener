"""
Google Drive integration endpoints
"""

import os
import tempfile
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from app.services.google_drive_service import GoogleDriveService
from app.services.resume_parser import ResumeParser

router = APIRouter()


class GoogleDriveAuthResponse(BaseModel):
    authorization_url: str
    state: str


class GoogleDriveTokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    token_type: str = "Bearer"


class GoogleDriveFileResponse(BaseModel):
    id: str
    name: str
    mimeType: str
    size: Optional[str] = None
    modifiedTime: str
    webViewLink: str


class GoogleDriveFilesListResponse(BaseModel):
    result: str = "success"
    message: str = "Files retrieved successfully"
    files: List[GoogleDriveFileResponse]
    nextPageToken: Optional[str] = None
    hasMore: bool = False
    total: int


class GoogleDriveUploadResponse(BaseModel):
    result: str = "success"
    message: str = "Resume uploaded and processed successfully"
    filename: str
    file_id: str
    parsed_data: Dict[str, Any]
    processing_time_ms: int


class GoogleDriveFolderResponse(BaseModel):
    id: str
    name: str
    modifiedTime: str
    webViewLink: str


class GoogleDriveBrowseResponse(BaseModel):
    result: str = "success"
    message: str = "Browse data retrieved successfully"
    current_folder: Optional[GoogleDriveFolderResponse] = None
    folders: List[GoogleDriveFolderResponse]
    files: List[GoogleDriveFileResponse]
    parent_folder_id: Optional[str] = None
    breadcrumbs: List[GoogleDriveFolderResponse]


class GoogleDriveBulkFileResult(BaseModel):
    file_id: str
    filename: str
    success: bool
    parsed_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    processing_time_ms: int


class GoogleDriveBulkUploadResponse(BaseModel):
    result: str = "success"
    message: str
    total_files: int
    successful_files: int
    failed_files: int
    results: List[GoogleDriveBulkFileResult]
    total_processing_time_ms: int
    batch_id: Optional[str] = None
    task_id: Optional[str] = None
    async_processing: bool = False


@router.get("/auth", response_model=GoogleDriveAuthResponse)
async def initiate_google_drive_auth(
    force_consent: bool = Query(False, description="Force consent screen to refresh scopes")
) -> Any:
    """
    Initiate Google Drive OAuth flow
    Note: This endpoint doesn't require authentication as it's the start of the OAuth flow
    """
    try:
        drive_service = GoogleDriveService()

        # Use a random state for security - in production you'd want to store this securely
        import uuid
        state = str(uuid.uuid4())
        authorization_url = drive_service.get_authorization_url(state=state)

        return GoogleDriveAuthResponse(
            authorization_url=authorization_url,
            state=state
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google Drive authentication: {str(e)}"
        )


@router.get("/callback")
async def google_drive_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for security"),
    error: Optional[str] = Query(None, description="Error from Google OAuth"),
) -> Any:
    """
    Handle Google Drive OAuth callback
    """
    if error:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "result": "failure",
                "message": f"Google Drive authorization failed: {error}"
            }
        )
    
    try:
        drive_service = GoogleDriveService()
        tokens = drive_service.exchange_code_for_tokens(code)
        
        # In a real application, you would store these tokens securely
        # associated with the user (identified by the state parameter)
        # For now, we'll return them to the frontend
        
        # Redirect to frontend with success
        frontend_url = "http://localhost:3000/dashboard/resumes/upload"
        return RedirectResponse(
            url=f"{frontend_url}?google_drive_auth=success&access_token={tokens['access_token']}"
        )
        
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "result": "failure",
                "message": str(e)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "result": "failure",
                "message": f"Failed to process Google Drive callback: {str(e)}"
            }
        )


@router.get("/files", response_model=GoogleDriveFilesListResponse)
async def list_google_drive_files(
    access_token: str = Query(..., description="Google Drive access token"),
    folder_id: Optional[str] = Query(None, description="Folder ID to list files from"),
    page_size: int = Query(50, ge=1, le=100, description="Number of files per page"),
    page_token: Optional[str] = Query(None, description="Page token for pagination"),
    search: Optional[str] = Query(None, description="Search query for files"),
) -> Any:
    """
    List files from Google Drive
    """
    try:
        drive_service = GoogleDriveService()
        
        # Build credentials dict from access token
        # In production, you'd retrieve full credentials from secure storage
        credentials_dict = {
            "token": access_token,
            "client_id": drive_service.client_config["web"]["client_id"],
            "client_secret": drive_service.client_config["web"]["client_secret"],
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        
        # Get resume-compatible MIME types
        resume_mime_types = drive_service.get_resume_mime_types()
        
        if search:
            # Search files
            result = await drive_service.search_files(
                credentials_dict=credentials_dict,
                search_query=search,
                mime_types=resume_mime_types,
                page_size=page_size
            )
            files = result["files"]
            next_page_token = None
            has_more = False
        else:
            # List files
            result = await drive_service.list_files(
                credentials_dict=credentials_dict,
                folder_id=folder_id,
                mime_types=resume_mime_types,
                page_size=page_size,
                page_token=page_token
            )
            files = result["files"]
            next_page_token = result.get("nextPageToken")
            has_more = result.get("hasMore", False)
        
        # Convert to response format
        file_responses = [
            GoogleDriveFileResponse(
                id=file["id"],
                name=file["name"],
                mimeType=file["mimeType"],
                size=file.get("size"),
                modifiedTime=file["modifiedTime"],
                webViewLink=file["webViewLink"]
            )
            for file in files
        ]
        
        return GoogleDriveFilesListResponse(
            files=file_responses,
            nextPageToken=next_page_token,
            hasMore=has_more,
            total=len(file_responses)
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list Google Drive files: {str(e)}"
        )


@router.get("/browse", response_model=GoogleDriveBrowseResponse)
async def browse_google_drive(
    access_token: str = Query(..., description="Google Drive access token"),
    folder_id: Optional[str] = Query(None, description="Folder ID to browse (root if not provided)"),
    show_all_files: bool = Query(False, description="Show all files or only resume files"),
) -> Any:
    """
    Browse Google Drive folders and files with navigation
    """
    try:
        drive_service = GoogleDriveService()

        # Build credentials dict from access token
        credentials_dict = {
            "token": access_token,
            "client_id": drive_service.client_config["web"]["client_id"],
            "client_secret": drive_service.client_config["web"]["client_secret"],
            "token_uri": "https://oauth2.googleapis.com/token",
        }

        # Get current folder info if we're not at root
        current_folder = None
        parent_folder_id = None
        breadcrumbs = []

        if folder_id:
            try:
                folder_metadata = await drive_service.get_file_metadata(credentials_dict, folder_id)
                current_folder = GoogleDriveFolderResponse(
                    id=folder_metadata["id"],
                    name=folder_metadata["name"],
                    modifiedTime=folder_metadata["modifiedTime"],
                    webViewLink=folder_metadata["webViewLink"]
                )

                # Get parent folder ID
                if "parents" in folder_metadata and folder_metadata["parents"]:
                    parent_folder_id = folder_metadata["parents"][0]

            except Exception:
                # If folder doesn't exist or can't be accessed, browse root
                folder_id = None

        # List folders in current directory
        folders_result = await drive_service.list_files(
            credentials_dict=credentials_dict,
            folder_id=folder_id,
            mime_types=["application/vnd.google-apps.folder"],
            page_size=100
        )

        folders = [
            GoogleDriveFolderResponse(
                id=folder["id"],
                name=folder["name"],
                modifiedTime=folder["modifiedTime"],
                webViewLink=folder["webViewLink"]
            )
            for folder in folders_result["files"]
        ]

        # List files in current directory
        if show_all_files:
            # Show all files
            files_result = await drive_service.list_files(
                credentials_dict=credentials_dict,
                folder_id=folder_id,
                mime_types=None,  # No filter
                page_size=100
            )
        else:
            # Show only resume files
            resume_mime_types = drive_service.get_resume_mime_types()
            files_result = await drive_service.list_files(
                credentials_dict=credentials_dict,
                folder_id=folder_id,
                mime_types=resume_mime_types,
                page_size=100
            )

        files = [
            GoogleDriveFileResponse(
                id=file["id"],
                name=file["name"],
                mimeType=file["mimeType"],
                size=file.get("size"),
                modifiedTime=file["modifiedTime"],
                webViewLink=file["webViewLink"]
            )
            for file in files_result["files"]
            if file["mimeType"] != "application/vnd.google-apps.folder"  # Exclude folders from files list
        ]

        return GoogleDriveBrowseResponse(
            current_folder=current_folder,
            folders=folders,
            files=files,
            parent_folder_id=parent_folder_id,
            breadcrumbs=breadcrumbs
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to browse Google Drive: {str(e)}"
        )


@router.post("/upload-resume", response_model=GoogleDriveUploadResponse)
async def upload_resume_from_google_drive(
    file_id: str = Query(..., description="Google Drive file ID"),
    access_token: str = Query(..., description="Google Drive access token"),
    job_id: Optional[str] = Query(None, description="Job ID for resume matching"),
) -> Any:
    """
    Upload and process resume from Google Drive
    """
    try:
        drive_service = GoogleDriveService()
        
        # Build credentials dict
        credentials_dict = {
            "token": access_token,
            "client_id": drive_service.client_config["web"]["client_id"],
            "client_secret": drive_service.client_config["web"]["client_secret"],
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        
        # Validate file exists and get metadata
        file_metadata = await drive_service.get_file_metadata(credentials_dict, file_id)
        filename = file_metadata["name"]
        
        # Validate file type
        allowed_mime_types = drive_service.get_resume_mime_types()
        if file_metadata["mimeType"] not in allowed_mime_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_metadata['mimeType']}"
            )
        
        # Download file to temporary location
        tmp_file_path = await drive_service.save_file_temporarily(credentials_dict, file_id)
        
        try:
            # Parse resume
            parser = ResumeParser()
            parsed_data = await parser.parse_resume(tmp_file_path)
            
            return GoogleDriveUploadResponse(
                filename=filename,
                file_id=file_id,
                parsed_data=parsed_data,
                processing_time_ms=0  # TODO: Add actual timing
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload resume from Google Drive: {str(e)}"
        )


@router.post("/bulk-upload-resumes", response_model=GoogleDriveBulkUploadResponse)
async def bulk_upload_resumes_from_google_drive(
    file_ids: List[str] = Query(..., description="List of Google Drive file IDs"),
    access_token: str = Query(..., description="Google Drive access token"),
    job_id: Optional[str] = Query(None, description="Job ID for resume matching"),
    user_id: Optional[str] = Query(None, description="User ID for progress tracking"),
    async_processing: bool = Query(False, description="Use async processing for large batches"),
) -> Any:
    """
    Bulk upload and process multiple resumes from Google Drive with smart processing
    """
    import time
    import asyncio
    import uuid
    from app.tasks.resume_tasks import process_bulk_resumes_task
    from app.models.resume_processing import BatchProcessingJob, ProcessingStatus

    start_time = time.time()

    try:
        # Determine processing strategy based on batch size
        batch_size = len(file_ids)
        use_async = async_processing or batch_size > 10

        drive_service = GoogleDriveService()

        # Build credentials dict
        credentials_dict = {
            "token": access_token,
            "client_id": drive_service.client_config["web"]["client_id"],
            "client_secret": drive_service.client_config["web"]["client_secret"],
            "token_uri": "https://oauth2.googleapis.com/token",
        }

        if use_async:
            # Use async processing for large batches
            batch_id = str(uuid.uuid4())

            # Create batch job record
            batch_job = BatchProcessingJob(
                batch_id=batch_id,
                user_id=user_id or "anonymous",
                total_files=batch_size,
                file_ids=file_ids,
                status=ProcessingStatus.PENDING
            )
            await batch_job.insert()

            # Queue the task
            task = process_bulk_resumes_task.delay(
                file_ids,
                access_token,
                credentials_dict,
                user_id,
                job_id
            )

            # Update batch job with task ID
            batch_job.celery_task_id = task.id
            batch_job.status = ProcessingStatus.PROCESSING
            await batch_job.save()

            return GoogleDriveBulkUploadResponse(
                message=f"Batch processing started for {batch_size} files. Use batch_id {batch_id} to track progress.",
                total_files=batch_size,
                successful_files=0,
                failed_files=0,
                results=[],
                total_processing_time_ms=int((time.time() - start_time) * 1000),
                batch_id=batch_id,
                task_id=task.id,
                async_processing=True
            )

        # Synchronous processing for smaller batches
        parser = ResumeParser()
        results = []
        successful_files = 0
        failed_files = 0

        # Process files concurrently for better performance
        async def process_single_file(file_id: str) -> GoogleDriveBulkFileResult:
            file_start_time = time.time()

            try:
                # Get file metadata
                metadata_start = time.time()
                file_metadata = await drive_service.get_file_metadata(credentials_dict, file_id)
                filename = file_metadata["name"]
                print(f"Metadata fetch for {filename}: {int((time.time() - metadata_start) * 1000)}ms")

                # Validate file type
                allowed_mime_types = drive_service.get_resume_mime_types()
                if file_metadata["mimeType"] not in allowed_mime_types:
                    return GoogleDriveBulkFileResult(
                        file_id=file_id,
                        filename=filename,
                        success=False,
                        error_message=f"Unsupported file type: {file_metadata['mimeType']}",
                        processing_time_ms=int((time.time() - file_start_time) * 1000)
                    )

                # Download and process file
                download_start = time.time()
                tmp_file_path = await drive_service.save_file_temporarily(credentials_dict, file_id)
                print(f"Download for {filename}: {int((time.time() - download_start) * 1000)}ms")

                try:
                    # Parse resume with timeout (30 seconds max per file)
                    parse_start = time.time()
                    parsed_data = await asyncio.wait_for(
                        parser.parse_resume(tmp_file_path),
                        timeout=30.0
                    )
                    print(f"Parse for {filename}: {int((time.time() - parse_start) * 1000)}ms")

                    return GoogleDriveBulkFileResult(
                        file_id=file_id,
                        filename=filename,
                        success=True,
                        parsed_data=parsed_data,
                        processing_time_ms=int((time.time() - file_start_time) * 1000)
                    )

                except asyncio.TimeoutError:
                    return GoogleDriveBulkFileResult(
                        file_id=file_id,
                        filename=filename,
                        success=False,
                        error_message="File processing timed out (30 seconds)",
                        processing_time_ms=int((time.time() - file_start_time) * 1000)
                    )

                finally:
                    # Clean up temporary file
                    if os.path.exists(tmp_file_path):
                        os.unlink(tmp_file_path)

            except Exception as e:
                return GoogleDriveBulkFileResult(
                    file_id=file_id,
                    filename=f"unknown_{file_id}",
                    success=False,
                    error_message=str(e),
                    processing_time_ms=int((time.time() - file_start_time) * 1000)
                )

        # Process files with controlled concurrency (max 10 at a time for better performance)
        semaphore = asyncio.Semaphore(10)

        async def process_with_semaphore(file_id: str):
            async with semaphore:
                return await process_single_file(file_id)

        # Execute all file processing tasks
        tasks = [process_with_semaphore(file_id) for file_id in file_ids]
        results = await asyncio.gather(*tasks)

        # Count successes and failures
        for result in results:
            if result.success:
                successful_files += 1
            else:
                failed_files += 1

        total_processing_time = int((time.time() - start_time) * 1000)

        return GoogleDriveBulkUploadResponse(
            message=f"Processed {len(file_ids)} files: {successful_files} successful, {failed_files} failed",
            total_files=len(file_ids),
            successful_files=successful_files,
            failed_files=failed_files,
            results=results,
            total_processing_time_ms=total_processing_time
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process bulk upload: {str(e)}"
        )


@router.get("/batch-status/{batch_id}")
async def get_batch_processing_status(batch_id: str) -> Any:
    """
    Get the status of a batch processing job
    """
    from app.models.resume_processing import BatchProcessingJob
    from app.core.celery_app import celery_app

    try:
        # Find the batch job
        batch_job = await BatchProcessingJob.find_one(BatchProcessingJob.batch_id == batch_id)

        if not batch_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Batch job {batch_id} not found"
            )

        # Get Celery task status if available
        task_status = None
        task_result = None

        if batch_job.celery_task_id:
            task = celery_app.AsyncResult(batch_job.celery_task_id)
            task_status = task.status

            if task.ready():
                if task.successful():
                    task_result = task.result
                else:
                    task_result = {"error": str(task.info)}

        return {
            "batch_id": batch_id,
            "status": batch_job.status,
            "total_files": batch_job.total_files,
            "processed_files": batch_job.processed_files,
            "successful_files": batch_job.successful_files,
            "failed_files": batch_job.failed_files,
            "progress_percentage": batch_job.progress_percentage,
            "current_status_message": batch_job.current_status_message,
            "created_at": batch_job.created_at,
            "started_at": batch_job.started_at,
            "completed_at": batch_job.completed_at,
            "celery_task_id": batch_job.celery_task_id,
            "celery_task_status": task_status,
            "results": task_result if task_result else batch_job.processing_summary
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get batch status: {str(e)}"
        )


@router.get("/validate-token")
async def validate_google_drive_token(
    access_token: str = Query(..., description="Google Drive access token"),
) -> Any:
    """
    Validate Google Drive access token
    """
    try:
        drive_service = GoogleDriveService()

        credentials_dict = {
            "token": access_token,
            "client_id": drive_service.client_config["web"]["client_id"],
            "client_secret": drive_service.client_config["web"]["client_secret"],
            "token_uri": "https://oauth2.googleapis.com/token",
        }

        validation_result = drive_service.validate_credentials(credentials_dict)

        return {
            "result": "success" if validation_result["valid"] else "failure",
            "message": validation_result["message"],
            "valid": validation_result["valid"],
            "requires_reauth": validation_result.get("requires_reauth", False),
            "user_email": validation_result.get("user_email")
        }

    except Exception as e:
        return {
            "result": "failure",
            "message": f"Failed to validate token: {str(e)}",
            "valid": False,
            "requires_reauth": True
        }
