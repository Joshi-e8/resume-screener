"""
Google Drive service for file operations and authentication
"""

import io
import tempfile
from typing import Any, Dict, List, Optional, Tuple

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
from google_auth_oauthlib.flow import Flow

from app.core.config import settings


class GoogleDriveService:
    """Service for Google Drive integration"""

    def __init__(self):
        # Include all scopes that might be used by the application
        self.scopes = [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.file'
        ]
        # Use existing Google OAuth credentials for Drive API
        self.client_config = {
            "web": {
                "client_id": settings.GOOGLE_DRIVE_CLIENT_ID or settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_DRIVE_CLIENT_SECRET or settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_DRIVE_REDIRECT_URI]
            }
        }

    def get_authorization_url(self, state: str = None) -> str:
        """
        Generate Google Drive authorization URL
        """
        client_id = settings.GOOGLE_DRIVE_CLIENT_ID or settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_DRIVE_CLIENT_SECRET or settings.GOOGLE_CLIENT_SECRET

        if not client_id or not client_secret:
            raise ValueError("Google credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")

        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.scopes,
            redirect_uri=settings.GOOGLE_DRIVE_REDIRECT_URI
        )
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',  # Force consent screen to get refresh token
            state=state
        )
        
        return authorization_url

    def exchange_code_for_tokens(self, authorization_code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access tokens
        """
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                redirect_uri=settings.GOOGLE_DRIVE_REDIRECT_URI
            )

            flow.fetch_token(code=authorization_code)
            credentials = flow.credentials

            # Create credentials dict - handle missing refresh_token gracefully
            credentials_dict = {
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,  # May be None
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes,
                "expiry": credentials.expiry.isoformat() if credentials.expiry else None
            }

            # If no refresh token, add a warning but don't fail
            if not credentials.refresh_token:
                credentials_dict["warning"] = (
                    "No refresh token received. Token will expire and require re-authentication. "
                    "To get a refresh token: 1) Go to https://myaccount.google.com/permissions, "
                    "2) Remove access for this application, 3) Clear browser cookies, 4) Try again."
                )

            return credentials_dict

        except Exception as e:
            error_msg = str(e)
            if "Scope has changed" in error_msg:
                raise ValueError(
                    "OAuth scope mismatch detected. Please clear your browser cookies for this site "
                    "and try the Google Drive authentication again. This happens when the application "
                    "scopes have been updated."
                )
            raise ValueError(f"Failed to exchange authorization code: {error_msg}")

    def build_service(self, credentials_dict: Dict[str, Any]):
        """
        Build Google Drive service with credentials
        """
        try:
            # Handle both "token" and "access_token" keys for compatibility
            access_token = credentials_dict.get("access_token") or credentials_dict.get("token")

            if not access_token:
                raise ValueError("No access token provided")

            # If we don't have a refresh_token, create minimal credentials with required fields
            if not credentials_dict.get("refresh_token"):
                # Create credentials with minimal required fields, using None for missing refresh_token
                credentials = Credentials(
                    token=access_token,
                    refresh_token=None,  # Explicitly set to None
                    token_uri=credentials_dict.get("token_uri", "https://oauth2.googleapis.com/token"),
                    client_id=credentials_dict.get("client_id"),
                    client_secret=credentials_dict.get("client_secret"),
                    scopes=self.scopes
                )
            else:
                # Use full OAuth credentials when refresh_token is available
                normalized_dict = {
                    "token": access_token,
                    "refresh_token": credentials_dict.get("refresh_token"),
                    "token_uri": credentials_dict.get("token_uri", "https://oauth2.googleapis.com/token"),
                    "client_id": credentials_dict.get("client_id"),
                    "client_secret": credentials_dict.get("client_secret"),
                    "scopes": credentials_dict.get("scopes", self.scopes)
                }
                credentials = Credentials.from_authorized_user_info(normalized_dict, self.scopes)

                # Only try to refresh if token is expired
                if credentials.expired and credentials.refresh_token:
                    try:
                        credentials.refresh(Request())
                    except Exception as refresh_error:
                        raise ValueError(f"Failed to refresh token: {str(refresh_error)}")

            # Modern way: pass credentials directly to build()
            return build('drive', 'v3', credentials=credentials)
        except Exception as e:
            if "invalid_grant" in str(e) or "invalid_token" in str(e):
                raise ValueError("Token is invalid or expired. Please re-authenticate with Google Drive.")
            raise ValueError(f"Failed to build Google Drive service: {str(e)}")

    async def list_files(
        self, 
        credentials_dict: Dict[str, Any],
        folder_id: str = None,
        mime_types: List[str] = None,
        page_size: int = 100,
        page_token: str = None
    ) -> Dict[str, Any]:
        """
        List files from Google Drive
        """
        try:
            service = self.build_service(credentials_dict)
            
            # Build query
            query_parts = []
            
            # Filter by folder
            if folder_id:
                query_parts.append(f"'{folder_id}' in parents")
            
            # Filter by MIME types (for resume files)
            if mime_types:
                mime_conditions = [f"mimeType='{mime_type}'" for mime_type in mime_types]
                query_parts.append(f"({' or '.join(mime_conditions)})")
            
            # Exclude trashed files
            query_parts.append("trashed=false")
            
            query = " and ".join(query_parts) if query_parts else None
            
            # Execute request
            results = service.files().list(
                q=query,
                pageSize=page_size,
                pageToken=page_token,
                fields="nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, webViewLink)"
            ).execute()
            
            files = results.get('files', [])
            next_page_token = results.get('nextPageToken')
            
            return {
                "files": files,
                "nextPageToken": next_page_token,
                "hasMore": bool(next_page_token)
            }
            
        except HttpError as e:
            raise ValueError(f"Google Drive API error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to list files: {str(e)}")

    async def get_file_metadata(
        self,
        credentials_dict: Dict[str, Any],
        file_id: str
    ) -> Dict[str, Any]:
        """
        Get file metadata from Google Drive (async)
        """
        try:
            import asyncio
            import concurrent.futures

            def _get_metadata():
                service = self.build_service(credentials_dict)
                return service.files().get(
                    fileId=file_id,
                    fields="id, name, mimeType, size, modifiedTime, parents, webViewLink, description"
                ).execute()

            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                file_metadata = await loop.run_in_executor(executor, _get_metadata)

            return file_metadata

        except HttpError as e:
            raise ValueError(f"Google Drive API error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to get file metadata: {str(e)}")

    async def download_file(
        self, 
        credentials_dict: Dict[str, Any], 
        file_id: str
    ) -> Tuple[bytes, str]:
        """
        Download file from Google Drive
        Returns: (file_content, filename)
        """
        try:
            service = self.build_service(credentials_dict)
            
            # Get file metadata first
            file_metadata = await self.get_file_metadata(credentials_dict, file_id)
            filename = file_metadata.get('name', f'file_{file_id}')
            
            # Download file content
            request = service.files().get_media(fileId=file_id)
            file_io = io.BytesIO()
            downloader = MediaIoBaseDownload(file_io, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            file_content = file_io.getvalue()
            return file_content, filename
            
        except HttpError as e:
            raise ValueError(f"Google Drive API error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to download file: {str(e)}")

    async def save_file_temporarily(
        self,
        credentials_dict: Dict[str, Any],
        file_id: str
    ) -> str:
        """
        Download file from Google Drive and save to temporary location
        Returns: temporary file path
        """
        try:
            file_content, filename = await self.download_file(credentials_dict, file_id)

            # Determine file extension
            file_extension = ""
            if '.' in filename:
                file_extension = '.' + filename.split('.')[-1].lower()

            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
                tmp_file.write(file_content)
                tmp_file_path = tmp_file.name

            return tmp_file_path

        except Exception as e:
            raise ValueError(f"Failed to save file temporarily: {str(e)}")

    async def download_file_to_memory(
        self,
        credentials_dict: Dict[str, Any],
        file_id: str
    ) -> Tuple[bytes, str, str]:
        """
        Download file from Google Drive directly to memory (fully async)
        Returns: (file_content, filename, file_extension)
        """
        try:
            import asyncio
            import concurrent.futures

            def _download_file():
                service = self.build_service(credentials_dict)

                # Get file metadata
                file_metadata = service.files().get(
                    fileId=file_id,
                    fields="id, name, mimeType, size"
                ).execute()
                filename = file_metadata.get('name', f'file_{file_id}')

                # Determine file extension
                file_extension = ""
                if '.' in filename:
                    file_extension = '.' + filename.split('.')[-1].lower()

                # Download file content
                request = service.files().get_media(fileId=file_id)
                file_io = io.BytesIO()
                downloader = MediaIoBaseDownload(file_io, request)

                done = False
                while done is False:
                    status, done = downloader.next_chunk()

                file_content = file_io.getvalue()
                return file_content, filename, file_extension

            # Run in thread pool to avoid blocking the event loop
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                result = await loop.run_in_executor(executor, _download_file)

            return result

        except Exception as e:
            raise ValueError(f"Failed to download file to memory: {str(e)}")

    async def batch_get_metadata(
        self,
        credentials_dict: Dict[str, Any],
        file_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get metadata for multiple files in a single batch request (much faster)
        Returns: dict mapping file_id to metadata
        """
        try:
            service = self.build_service(credentials_dict)
            metadata_dict = {}

            # Process in batches of 100 (Google API limit)
            batch_size = 100
            for i in range(0, len(file_ids), batch_size):
                batch_ids = file_ids[i:i+batch_size]

                # Create batch request
                batch = service.new_batch_http_request()

                def create_callback(file_id):
                    def callback(request_id, response, exception):
                        if exception is None:
                            metadata_dict[file_id] = response
                        else:
                            print(f"Error getting metadata for {file_id}: {exception}")
                            metadata_dict[file_id] = None
                    return callback

                # Add requests to batch
                for file_id in batch_ids:
                    batch.add(
                        service.files().get(
                            fileId=file_id,
                            fields="id, name, mimeType, size, modifiedTime"
                        ),
                        callback=create_callback(file_id)
                    )

                # Execute batch
                batch.execute()

            return metadata_dict

        except Exception as e:
            raise ValueError(f"Failed to batch get metadata: {str(e)}")

    async def search_files(
        self, 
        credentials_dict: Dict[str, Any],
        search_query: str,
        mime_types: List[str] = None,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Search files in Google Drive
        """
        try:
            service = self.build_service(credentials_dict)
            
            # Build search query
            query_parts = [f"name contains '{search_query}'"]
            
            # Filter by MIME types
            if mime_types:
                mime_conditions = [f"mimeType='{mime_type}'" for mime_type in mime_types]
                query_parts.append(f"({' or '.join(mime_conditions)})")
            
            # Exclude trashed files
            query_parts.append("trashed=false")
            
            query = " and ".join(query_parts)
            
            # Execute search
            results = service.files().list(
                q=query,
                pageSize=page_size,
                fields="files(id, name, mimeType, size, modifiedTime, parents, webViewLink)"
            ).execute()
            
            files = results.get('files', [])
            
            return {
                "files": files,
                "query": search_query,
                "total": len(files)
            }
            
        except HttpError as e:
            raise ValueError(f"Google Drive API error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to search files: {str(e)}")

    def get_resume_mime_types(self) -> List[str]:
        """
        Get supported MIME types for resume files
        """
        return [
            'application/pdf',  # PDF files
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # DOCX
            'application/msword',  # DOC
            'text/plain'  # TXT
        ]

    async def get_folder_breadcrumbs(
        self,
        credentials_dict: Dict[str, Any],
        folder_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get breadcrumb trail for a folder (from root to current folder)
        """
        try:
            breadcrumbs = []
            current_folder_id = folder_id

            # Traverse up the folder hierarchy
            while current_folder_id:
                folder_metadata = await self.get_file_metadata(credentials_dict, current_folder_id)

                breadcrumbs.insert(0, {
                    "id": folder_metadata["id"],
                    "name": folder_metadata["name"],
                    "modifiedTime": folder_metadata["modifiedTime"],
                    "webViewLink": folder_metadata["webViewLink"]
                })

                # Get parent folder
                parents = folder_metadata.get("parents", [])
                current_folder_id = parents[0] if parents else None

                # Prevent infinite loops and limit depth
                if len(breadcrumbs) > 10:
                    break

            return breadcrumbs

        except Exception as e:
            # If we can't get breadcrumbs, return empty list
            return []

    def validate_credentials(self, credentials_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate Google Drive credentials and return detailed status
        """
        try:
            service = self.build_service(credentials_dict)
            # Try to make a simple API call
            user_info = service.about().get(fields="user").execute()
            return {
                "valid": True,
                "message": "Token is valid",
                "user_email": user_info.get("user", {}).get("emailAddress", "Unknown")
            }
        except ValueError as e:
            # These are our custom errors with helpful messages
            print(e,'error--------------------------')
            return {
                "valid": False,
                "message": str(e),
                "requires_reauth": True
            }
        except Exception as e:
            error_msg = str(e).lower()
            print(error_msg,'error_message------------------')
            if any(keyword in error_msg for keyword in ["invalid_grant", "invalid_token", "unauthorized", "expired"]):
                return {
                    "valid": False,
                    "message": "Token is invalid or expired. Please re-authenticate with Google Drive.",
                    "requires_reauth": True
                }
            return {
                "valid": False,
                "message": f"Token validation failed: {str(e)}",
                "requires_reauth": False
            }
