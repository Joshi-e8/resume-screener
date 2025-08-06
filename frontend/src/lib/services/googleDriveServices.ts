/**
 * Google Drive integration services for frontend
 */

import axios from 'axios';

// Types for Google Drive integration
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
}

export interface GoogleDriveAuthResponse {
  authorization_url: string;
  state: string;
}

export interface GoogleDriveFilesResponse {
  result: string;
  message: string;
  files: GoogleDriveFile[];
  nextPageToken?: string;
  hasMore: boolean;
  total: number;
}

export interface GoogleDriveUploadResponse {
  result: string;
  message: string;
  filename: string;
  file_id: string;
  parsed_data: any;
  processing_time_ms: number;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

export interface GoogleDriveBrowseResponse {
  result: string;
  message: string;
  current_folder?: GoogleDriveFolder;
  folders: GoogleDriveFolder[];
  files: GoogleDriveFile[];
  parent_folder_id?: string;
  breadcrumbs: GoogleDriveFolder[];
}

export interface GoogleDriveTokenValidation {
  result: string;
  message: string;
  valid: boolean;
}

class GoogleDriveService {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Set access token for API calls
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Clear access token
   */
  clearAccessToken() {
    this.accessToken = null;
  }

  /**
   * Get authorization URL to start OAuth flow
   */
  async getAuthorizationUrl(): Promise<GoogleDriveAuthResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/google-drive/auth`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Google Drive authorization URL:', error);
      throw new Error('Failed to initiate Google Drive authentication');
    }
  }

  /**
   * Validate Google Drive access token
   */
  async validateToken(accessToken: string): Promise<GoogleDriveTokenValidation> {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/google-drive/validate-token`, {
        params: { access_token: accessToken },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to validate Google Drive token:', error);
      return {
        result: 'failure',
        message: 'Failed to validate token',
        valid: false,
      };
    }
  }

  /**
   * List files from Google Drive
   */
  async listFiles(options: {
    folderId?: string;
    pageSize?: number;
    pageToken?: string;
    search?: string;
  } = {}): Promise<GoogleDriveFilesResponse> {
    if (!this.accessToken) {
      throw new Error('Google Drive access token not set');
    }

    try {
      const params: any = {
        access_token: this.accessToken,
        page_size: options.pageSize || 50,
      };

      if (options.folderId) params.folder_id = options.folderId;
      if (options.pageToken) params.page_token = options.pageToken;
      if (options.search) params.search = options.search;

      const response = await axios.get(`${this.baseURL}/api/v1/google-drive/files`, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to list Google Drive files:', error);
      throw new Error('Failed to retrieve files from Google Drive');
    }
  }

  /**
   * Upload resume from Google Drive
   */
  async uploadResume(fileId: string, jobId?: string): Promise<GoogleDriveUploadResponse> {
    if (!this.accessToken) {
      throw new Error('Google Drive access token not set');
    }

    try {
      const params: any = {
        file_id: fileId,
        access_token: this.accessToken,
      };

      if (jobId) params.job_id = jobId;

      const response = await axios.post(`${this.baseURL}/api/v1/google-drive/upload-resume`, null, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to upload resume from Google Drive:', error);
      throw new Error('Failed to upload resume from Google Drive');
    }
  }

  /**
   * Browse Google Drive folders and files
   */
  async browseFolder(folderId?: string, showAllFiles: boolean = false): Promise<GoogleDriveBrowseResponse> {
    if (!this.accessToken) {
      throw new Error('Google Drive access token not set');
    }

    try {
      const params: any = {
        access_token: this.accessToken,
        show_all_files: showAllFiles,
      };

      if (folderId) params.folder_id = folderId;

      const response = await axios.get(`${this.baseURL}/api/v1/google-drive/browse`, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to browse Google Drive folder:', error);
      throw new Error('Failed to browse Google Drive folder');
    }
  }

  /**
   * Search specifically for resume files
   */
  async searchResumes(query: string, pageSize: number = 50): Promise<GoogleDriveFilesResponse> {
    if (!this.accessToken) {
      throw new Error('Google Drive access token not set');
    }

    try {
      const params = {
        access_token: this.accessToken,
        query: query,
        page_size: pageSize,
      };

      const response = await axios.get(`${this.baseURL}/api/v1/google-drive/search-resumes`, {
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to search resume files:', error);
      throw new Error('Failed to search resume files');
    }
  }

  /**
   * Search files in Google Drive (legacy method)
   */
  async searchFiles(query: string, pageSize: number = 50): Promise<GoogleDriveFilesResponse> {
    return this.listFiles({ search: query, pageSize });
  }

  /**
   * Get supported file types for resumes
   */
  getSupportedFileTypes(): string[] {
    return ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
  }

  /**
   * Check if file type is supported
   */
  isFileTypeSupported(mimeType: string): boolean {
    return this.getSupportedFileTypes().includes(mimeType);
  }

  /**
   * Format file size for display
   */
  formatFileSize(sizeString?: string): string {
    if (!sizeString) return 'Unknown size';
    
    const size = parseInt(sizeString);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return '📄';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return '📝';
      case 'text/plain':
        return '📃';
      default:
        return '📄';
    }
  }



  /**
   * Handle OAuth callback and extract access token
   */
  static handleOAuthCallback(): string | null {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const authStatus = urlParams.get('google_drive_auth');

    if (authStatus === 'success' && accessToken) {
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('google_drive_auth');
      url.searchParams.delete('access_token');
      window.history.replaceState({}, document.title, url.toString());

      return accessToken;
    }

    return null;
  }

  /**
   * Store access token in localStorage
   */
  static storeAccessToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_drive_access_token', token);
    }
  }

  /**
   * Retrieve access token from localStorage
   */
  static getStoredAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('google_drive_access_token');
    }
    return null;
  }

  /**
   * Remove stored access token
   */
  static removeStoredAccessToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_drive_access_token');
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default GoogleDriveService;
