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


class GoogleDriveUploadResponse(BaseModel):
    result: str = "success"
    message: str = "Resume uploaded and processed successfully"
    filename: str
    file_id: str
    parsed_data: Dict[str, Any]
    processing_time_ms: int


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

        # Get current folder info if folder_id is provided
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

                # Get parent folder ID for navigation
                parents = folder_metadata.get("parents", [])
                if parents:
                    parent_folder_id = parents[0]

                # Build breadcrumbs
                breadcrumb_data = await drive_service.get_folder_breadcrumbs(credentials_dict, folder_id)
                breadcrumbs = [
                    GoogleDriveFolderResponse(
                        id=crumb["id"],
                        name=crumb["name"],
                        modifiedTime=crumb["modifiedTime"],
                        webViewLink=crumb["webViewLink"]
                    )
                    for crumb in breadcrumb_data
                ]

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


@router.get("/search-resumes", response_model=GoogleDriveFilesListResponse)
async def search_resumes_in_drive(
    access_token: str = Query(..., description="Google Drive access token"),
    query: str = Query(..., description="Search query for resume files"),
    page_size: int = Query(50, ge=1, le=100, description="Number of files per page"),
) -> Any:
    """
    Search specifically for resume files in Google Drive
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

        # Get resume-compatible MIME types
        resume_mime_types = drive_service.get_resume_mime_types()

        # Search for resume files
        result = await drive_service.search_files(
            credentials_dict=credentials_dict,
            search_query=query,
            mime_types=resume_mime_types,
            page_size=page_size
        )

        files = result["files"]

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
            nextPageToken=None,
            hasMore=False,
            total=len(file_responses),
            message=f"Found {len(file_responses)} resume files matching '{query}'"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search resume files: {str(e)}"
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
