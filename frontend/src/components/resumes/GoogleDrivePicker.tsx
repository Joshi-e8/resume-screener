"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  Search, 
  RefreshCw, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import { googleDriveService, GoogleDriveFile, GoogleDriveFolder, GoogleDriveBrowseResponse } from '@/lib/services/googleDriveServices';
import GoogleDriveService from '@/lib/services/googleDriveServices';

interface GoogleDrivePickerProps {
  onFilesSelected: (files: GoogleDriveFile[]) => void;
  onAuthRequired: () => void;
  multiSelect?: boolean;
  className?: string;
}

type ViewMode = 'browse' | 'search';

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({
  onFilesSelected,
  onAuthRequired,
  multiSelect = true,
  className = ''
}) => {
  // File and folder state
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<GoogleDriveFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<GoogleDriveFolder[]>([]);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [showAllFiles, setShowAllFiles] = useState(false);

  // Legacy pagination state (for search mode)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = GoogleDriveService.getStoredAccessToken();
      if (token) {
        googleDriveService.setAccessToken(token);
        try {
          const validation = await googleDriveService.validateToken(token);
          if (validation.valid) {
            setIsAuthenticated(true);
            loadFiles();
          } else {
            // Token is invalid, clear it and show re-auth
            GoogleDriveService.removeStoredAccessToken();
            googleDriveService.clearAccessToken();
            setIsAuthenticated(false);
            if (validation.message) {
              setError(validation.message);
            }
          }
        } catch (error) {
          // Network error or other issue
          GoogleDriveService.removeStoredAccessToken();
          googleDriveService.clearAccessToken();
          setIsAuthenticated(false);
          setError('Failed to verify Google Drive connection. Please reconnect.');
        }
      }
    };

    checkAuth();
  }, []);

  // Load files from Google Drive
  const loadFiles = useCallback(async (pageToken?: string, search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await googleDriveService.listFiles({
        pageToken,
        search,
        pageSize: 50
      });

      if (pageToken) {
        // Append to existing files for pagination
        setFiles(prev => [...prev, ...response.files]);
      } else {
        // Replace files for new search or initial load
        setFiles(response.files);
      }

      setNextPageToken(response.nextPageToken || null);
      setHasMore(response.hasMore);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);

      // Check if it's a token-related error
      if (errorMessage.includes('token') || errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        setIsAuthenticated(false);
        GoogleDriveService.removeStoredAccessToken();
        googleDriveService.clearAccessToken();
        setError('Your Google Drive session has expired. Please reconnect to continue.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Browse folder (new method)
  const browseFolder = useCallback(async (folderId?: string) => {
    setLoading(true);
    setError(null);
    setViewMode('browse');

    try {
      const response = await googleDriveService.browseFolder(folderId, showAllFiles);

      setFiles(response.files);
      setFolders(response.folders);
      setCurrentFolderId(folderId || null);
      setCurrentFolder(response.current_folder || null);
      setBreadcrumbs(response.breadcrumbs);
      setParentFolderId(response.parent_folder_id || null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to browse folder';
      setError(errorMessage);
      setFiles([]);
      setFolders([]);

      // Check if it's a token-related error
      if (errorMessage.includes('token') || errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        setIsAuthenticated(false);
        GoogleDriveService.removeStoredAccessToken();
        googleDriveService.clearAccessToken();
        setError('Your Google Drive session has expired. Please reconnect to continue.');
      }
    } finally {
      setLoading(false);
    }
  }, [showAllFiles]);

  // Search for resume files
  const searchResumes = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setViewMode('search');

    try {
      const response = await googleDriveService.searchResumes(query);
      setFiles(response.files);
      setFolders([]); // No folders in search results

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search files';
      setError(errorMessage);
      setFiles([]);
      setFolders([]);

      // Check if it's a token-related error
      if (errorMessage.includes('token') || errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        setIsAuthenticated(false);
        GoogleDriveService.removeStoredAccessToken();
        googleDriveService.clearAccessToken();
        setError('Your Google Drive session has expired. Please reconnect to continue.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchResumes(query.trim());
    } else {
      browseFolder(currentFolderId || undefined);
    }
  }, [searchResumes, browseFolder, currentFolderId]);

  // Navigate to folder
  const navigateToFolder = useCallback((folderId: string) => {
    browseFolder(folderId);
  }, [browseFolder]);

  // Navigate to parent folder
  const navigateToParent = useCallback(() => {
    if (parentFolderId) {
      browseFolder(parentFolderId);
    } else {
      browseFolder(); // Go to root
    }
  }, [browseFolder, parentFolderId]);

  // Navigate to breadcrumb
  const navigateToBreadcrumb = useCallback((folderId: string) => {
    browseFolder(folderId);
  }, [browseFolder]);

  // Toggle file filter
  const toggleFileFilter = useCallback(() => {
    setShowAllFiles(prev => !prev);
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      browseFolder();
    }
  }, [isAuthenticated, browseFolder, showAllFiles]);

  // Handle file selection
  const handleFileSelect = (file: GoogleDriveFile) => {
    if (!multiSelect) {
      setSelectedFiles([file]);
      onFilesSelected([file]);
      return;
    }

    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      const newSelection = isSelected 
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file];
      
      onFilesSelected(newSelection);
      return newSelection;
    });
  };

  // Handle authentication
  const handleAuthenticate = async () => {
    try {
      const authResponse = await googleDriveService.getAuthorizationUrl();
      window.location.href = authResponse.authorization_url;
    } catch (err) {
      setError('Failed to initiate Google Drive authentication');
      onAuthRequired();
    }
  };

  // Load more files (pagination)
  const loadMore = () => {
    if (nextPageToken && !loading) {
      loadFiles(nextPageToken, searchQuery || undefined);
    }
  };

  // Refresh files
  const refresh = () => {
    setSelectedFiles([]);
    if (searchQuery.trim()) {
      searchResumes(searchQuery.trim());
    } else {
      browseFolder(currentFolderId || undefined);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-8 text-center ${className}`}>
        <Cloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect to Google Drive
        </h3>
        <p className="text-gray-600 mb-6">
          Access your resume files stored in Google Drive for easy upload and processing.
        </p>
        <button
          onClick={handleAuthenticate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
        >
          <Cloud className="w-5 h-5" />
          Connect Google Drive
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Cloud className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Google Drive Files</h3>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search resume files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Selected files count */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 text-sm text-blue-600">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 mx-6 mt-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            {(error.includes('expired') || error.includes('invalid') || error.includes('reconnect')) && (
              <button
                onClick={handleAuthenticate}
                className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      )}

      {/* Files list */}
      <div className="p-6">
        {loading && files.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-600">Loading files...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No files found</h4>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms' : 'No resume files found in your Google Drive'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const isSelected = selectedFiles.some(f => f.id === file.id);
              const isSupported = googleDriveService.isFileTypeSupported(file.mimeType);
              
              return (
                <div
                  key={file.id}
                  onClick={() => isSupported && handleFileSelect(file)}
                  className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isSupported
                      ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-2xl">
                        {googleDriveService.getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{googleDriveService.formatFileSize(file.size)}</span>
                          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                          {!isSupported && (
                            <span className="text-red-500 font-medium">Unsupported format</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load more button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Load more files'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
