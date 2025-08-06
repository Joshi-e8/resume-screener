"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  Search,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  ArrowLeft,
  Home,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  MoreHorizontal,
  Zap,
  X
} from 'lucide-react';
import { googleDriveService, GoogleDriveFile, GoogleDriveFolder } from '@/lib/services/googleDriveServices';
import GoogleDriveService from '@/lib/services/googleDriveServices';

interface EnhancedGoogleDrivePickerProps {
  onFilesSelected: (files: GoogleDriveFile[]) => void;
  onAuthRequired: () => void;
  multiSelect?: boolean;
  className?: string;
  hideEmptyState?: boolean;
}

type ViewMode = 'browse' | 'search';

export const EnhancedGoogleDrivePicker: React.FC<EnhancedGoogleDrivePickerProps> = ({
  onFilesSelected,
  onAuthRequired,
  multiSelect = true,
  className = '',
  hideEmptyState = false
}) => {
  console.log('🚀 EnhancedGoogleDrivePicker component loaded!');
  // File and folder state
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<GoogleDriveFolder[]>([]);
  const [processingFolder, setProcessingFolder] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [showAllFiles, setShowAllFiles] = useState(false);

  // Pagination and performance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const storedToken = GoogleDriveService.getStoredAccessToken();
      if (storedToken) {
        googleDriveService.setAccessToken(storedToken);

        try {
          const validation = await googleDriveService.validateToken(storedToken);
          if (validation.valid) {
            setIsAuthenticated(true);
          } else {
            GoogleDriveService.removeStoredAccessToken();
            googleDriveService.clearAccessToken();
            setIsAuthenticated(false);
            setError('Google Drive session expired. Please reconnect.');
          }
        } catch (error) {
          GoogleDriveService.removeStoredAccessToken();
          googleDriveService.clearAccessToken();
          setIsAuthenticated(false);
          setError('Failed to verify Google Drive connection. Please reconnect.');
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Sorting and filtering utilities
  const sortFiles = useCallback((files: GoogleDriveFile[]) => {
    return [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime();
          break;
        case 'size':
          const sizeA = parseInt(a.size || '0');
          const sizeB = parseInt(b.size || '0');
          comparison = sizeA - sizeB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortBy, sortOrder]);

  const sortFolders = useCallback((folders: GoogleDriveFolder[]) => {
    return [...folders].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortOrder]);

  // Pagination utilities
  const getPaginatedItems = useCallback(<T,>(items: T[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return items.slice(startIndex, endIndex);
  }, []);

  const getTotalPages = useCallback((totalItems: number, perPage: number) => {
    return Math.ceil(totalItems / perPage);
  }, []);

  // Browse folder
  const browseFolder = useCallback(async (folderId?: string, resetPage = true) => {
    setLoading(true);
    setError(null);
    setViewMode('browse');

    if (resetPage) {
      setCurrentPage(1);
    }

    try {
      const response = await googleDriveService.browseFolder(folderId, showAllFiles);

      // Sort the results
      const sortedFiles = sortFiles(response.files);
      const sortedFolders = sortFolders(response.folders);

      // Show only folders in root directory, files only when inside a folder
      const isRootDirectory = !folderId;
      const displayFiles = isRootDirectory ? [] : sortedFiles;
      const displayFolders = sortedFolders;

      setFiles(displayFiles);
      setFolders(displayFolders);
      setTotalFiles(displayFiles.length);
      setTotalFolders(displayFolders.length);
      setCurrentFolderId(folderId || null);
      setCurrentFolder(response.current_folder || null);
      setBreadcrumbs(response.breadcrumbs);
      setParentFolderId(response.parent_folder_id || null);

      // Debug logging
      console.log('Browse folder response:', {
        folderId,
        isRootDirectory,
        folders: displayFolders.length,
        files: displayFiles.length,
        actualFiles: sortedFiles.length,
        currentFolder: response.current_folder?.name,
        breadcrumbs: response.breadcrumbs.length,
        showAllFiles,
        viewMode: 'browse',
        currentFolderId: currentFolderId
      });

      // Log folder names for debugging
      if (displayFolders.length > 0) {
        console.log('Folders displayed:', displayFolders.map(f => f.name));
      } else {
        console.log('No folders found in current directory');
      }

      // Log file information
      if (isRootDirectory && sortedFiles.length > 0) {
        console.log(`Root directory: hiding ${sortedFiles.length} files, showing folders only`);
      } else if (displayFiles.length > 0) {
        console.log('Files displayed:', displayFiles.slice(0, 5).map(f => f.name));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to browse folder';
      setError(errorMessage);
      setFiles([]);
      setFolders([]);
      setTotalFiles(0);
      setTotalFolders(0);

      if (errorMessage.includes('token') || errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        setIsAuthenticated(false);
        GoogleDriveService.removeStoredAccessToken();
        googleDriveService.clearAccessToken();
        setError('Your Google Drive session has expired. Please reconnect to continue.');
      }
    } finally {
      setLoading(false);
    }
  }, [showAllFiles, sortFiles, sortFolders]);

  // Search for resume files
  const searchResumes = useCallback(async (query: string) => {
    console.log('🔍 Searching for:', query);
    setLoading(true);
    setError(null);
    setViewMode('search');

    try {
      const response = await googleDriveService.searchResumes(query);
      setFiles(response.files);
      setFolders([]);

      console.log('🔍 Search results:', {
        query,
        filesFound: response.files.length,
        viewMode: 'search'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search files';
      setError(errorMessage);
      setFiles([]);
      setFolders([]);

      console.error('🔍 Search failed:', errorMessage);

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
    // Don't trigger search immediately, let the user finish typing
  }, []);

  // Navigation handlers
  const navigateToFolder = useCallback((folderId: string) => {
    browseFolder(folderId);
  }, [browseFolder]);

  const navigateToParent = useCallback(() => {
    if (parentFolderId) {
      browseFolder(parentFolderId);
    } else {
      browseFolder(); // Go to root
    }
  }, [browseFolder, parentFolderId]);

  const navigateToRoot = useCallback(() => {
    browseFolder();
  }, [browseFolder]);

  const navigateToBreadcrumb = useCallback((folderId: string) => {
    browseFolder(folderId);
  }, [browseFolder]);

  // Toggle file filter
  const toggleFileFilter = useCallback(() => {
    setShowAllFiles(prev => !prev);
  }, []);

  // Sorting handlers
  const handleSort = useCallback((newSortBy: 'name' | 'date' | 'size') => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortBy]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Bulk folder processing
  const processFolderBulk = useCallback(async (folder: GoogleDriveFolder) => {
    setProcessingFolder(folder.id);
    setError(null);

    try {
      console.log(`🗂️ Processing entire folder: ${folder.name}`);

      // Browse the folder to get all files
      const response = await googleDriveService.browseFolder(folder.id, showAllFiles);

      // Filter for resume files only
      const resumeFiles = response.files.filter(file =>
        googleDriveService.isFileTypeSupported(file.mimeType)
      );

      if (resumeFiles.length === 0) {
        setError(`No resume files found in folder "${folder.name}"`);
        return;
      }

      console.log(`📄 Found ${resumeFiles.length} resume files in "${folder.name}"`);

      // Add folder to selected folders and all its resume files to selected files
      setSelectedFolders(prev => {
        const isAlreadySelected = prev.some(f => f.id === folder.id);
        if (isAlreadySelected) {
          return prev.filter(f => f.id !== folder.id);
        } else {
          return [...prev, folder];
        }
      });

      setSelectedFiles(prev => {
        // Remove any files from this folder first
        const filesNotFromThisFolder = prev.filter(file =>
          !resumeFiles.some(rf => rf.id === file.id)
        );

        // Check if folder was already selected
        const folderWasSelected = selectedFolders.some(f => f.id === folder.id);

        if (folderWasSelected) {
          // Deselecting folder - remove its files
          return filesNotFromThisFolder;
        } else {
          // Selecting folder - add its files
          return [...filesNotFromThisFolder, ...resumeFiles];
        }
      });

      // Call the callback with all selected files
      const allSelectedFiles = selectedFiles.filter(file =>
        !resumeFiles.some(rf => rf.id === file.id)
      ).concat(resumeFiles);

      onFilesSelected(allSelectedFiles);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process folder';
      setError(`Failed to process folder "${folder.name}": ${errorMessage}`);
      console.error('🗂️ Folder processing failed:', errorMessage);
    } finally {
      setProcessingFolder(null);
    }
  }, [showAllFiles, selectedFolders, selectedFiles, onFilesSelected]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // View type toggle
  const toggleViewType = useCallback(() => {
    setViewType(prev => prev === 'list' ? 'grid' : 'list');
  }, []);

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

  // Refresh
  const refresh = () => {
    setSelectedFiles([]);
    if (searchQuery.trim()) {
      searchResumes(searchQuery.trim());
    } else {
      browseFolder(currentFolderId || undefined);
    }
  };

  // Re-sort when sort parameters change
  useEffect(() => {
    if (files.length > 0) {
      setFiles(prev => sortFiles(prev));
    }
    if (folders.length > 0) {
      setFolders(prev => sortFolders(prev));
    }
  }, [sortBy, sortOrder, sortFiles, sortFolders]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🚀 Initial load: browsing root folder');
      browseFolder();
    }
  }, [isAuthenticated, browseFolder]);

  // Handle file filter changes
  useEffect(() => {
    if (isAuthenticated && viewMode === 'browse') {
      browseFolder(currentFolderId || undefined);
    }
  }, [showAllFiles]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchResumes(searchQuery.trim());
      } else if (viewMode === 'search') {
        // If search is cleared, go back to browse mode
        setViewMode('browse');
        browseFolder(currentFolderId || undefined);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery, searchResumes, browseFolder, currentFolderId, viewMode]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isCheckingAuth) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-8 text-center ${className}`}>
        <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Checking Google Drive Connection
        </h3>
        <p className="text-gray-600">
          Verifying your Google Drive access...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-8 text-center ${className}`}>
        <Cloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect to Google Drive
        </h3>
        <p className="text-gray-600 mb-6">
          Browse and select resume files from your Google Drive for easy upload and processing.
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
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-500" />
            Google Drive Browser
          </h3>
          <div className="flex items-center gap-2">
            {/* Performance Mode Toggle */}
            {(totalFiles > 100 || totalFolders > 50) && (
              <button
                onClick={() => window.location.href = window.location.href + '?performance=true'}
                className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors duration-200"
                title="Switch to high-performance mode for large datasets"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}

            {/* View Type Toggle */}
            <button
              onClick={toggleViewType}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
              title={viewType === 'list' ? 'Switch to grid view' : 'Switch to list view'}
            >
              {viewType === 'list' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>

            {/* File Filter Toggle */}
            <button
              onClick={toggleFileFilter}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                showAllFiles
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showAllFiles ? 'Show only resume files' : 'Show all files'}
            >
              {showAllFiles ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Items per page selector */}
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white"
              title="Items per page"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for resume files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setViewMode('browse');
                browseFolder(currentFolderId || undefined);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-5 h-5"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Mode Indicator */}
      {viewMode === 'search' && searchQuery && (
        <div className="px-6 py-3 border-b border-gray-200 bg-yellow-50">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <Search className="w-4 h-4" />
            <span>Searching for: <strong>"{searchQuery}"</strong></span>
            <button
              onClick={() => {
                setSearchQuery('');
                setViewMode('browse');
                browseFolder(currentFolderId || undefined);
              }}
              className="ml-2 text-yellow-600 hover:text-yellow-700 underline"
            >
              Clear search
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {viewMode === 'browse' && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={navigateToRoot}
              className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              My Drive
            </button>
            
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateToBreadcrumb(crumb.id)}
                  className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 truncate max-w-32"
                  title={crumb.name}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Back button */}
          {(parentFolderId || currentFolderId) && (
            <button
              onClick={navigateToParent}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to parent folder
            </button>
          )}
        </div>
      )}

      {/* Root Directory Info Banner */}
      {!currentFolderId && viewMode === 'browse' && !loading && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Bulk Folder Processing</h4>
              <p className="text-xs text-blue-700 mt-1">
                Click "Process Folder" to automatically select all resume files in a folder, or browse individual folders to select specific files.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Sorting and Stats Bar */}
      {!loading && (files.length > 0 || folders.length > 0) && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                {viewMode === 'browse' ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <Search className="w-4 h-4 text-yellow-500" />
                )}
                <span className="font-medium">
                  {viewMode === 'browse' ? 'Browsing' : 'Search Results'}
                  {currentFolder && `: ${currentFolder.name}`}
                </span>
              </div>
              <span>
                {totalFolders > 0 && `${totalFolders} folder${totalFolders !== 1 ? 's' : ''}`}
                {totalFolders > 0 && totalFiles > 0 && ', '}
                {totalFiles > 0 && `${totalFiles} file${totalFiles !== 1 ? 's' : ''}`}
                {!currentFolderId && totalFolders > 0 && totalFiles === 0 && (
                  <span className="text-gray-500 ml-2">(files shown inside folders)</span>
                )}
              </span>
              {viewMode === 'browse' && !showAllFiles && totalFiles > 0 && (
                <span className="text-blue-600">(resume files only)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <button
                onClick={() => handleSort('name')}
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded transition-colors ${
                  sortBy === 'name' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort('date')}
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded transition-colors ${
                  sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Date
                {sortBy === 'date' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort('size')}
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded transition-colors ${
                  sortBy === 'size' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Size
                {sortBy === 'size' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-600">
              {viewMode === 'search' ? 'Searching files...' : 'Loading folder...'}
            </span>
          </div>
        ) : (
          <>
            {/* Folders (only in browse mode) */}
            {viewMode === 'browse' && (
              folders.length > 0 ? (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Folders ({totalFolders})
                </h4>
                <div className={`gap-3 ${
                  viewType === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-2'
                }`}>
                  {getPaginatedItems(folders, currentPage, itemsPerPage).map((folder) => {
                    const isSelected = selectedFolders.some(f => f.id === folder.id);
                    const isProcessing = processingFolder === folder.id;

                    return (
                      <div
                        key={folder.id}
                        className={`border rounded-lg transition-all duration-200 ${
                          isSelected
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:border-blue-300'
                        } ${viewType === 'grid' ? 'p-4' : 'p-3'}`}
                      >
                        <div className="flex items-center gap-3">
                          <FolderOpen className={`${
                            isSelected ? 'text-green-600' : 'text-blue-500'
                          } ${viewType === 'grid' ? 'w-8 h-8' : 'w-6 h-6'}`} />

                          <div className="flex-1 min-w-0">
                            <h5 className={`font-medium truncate ${
                              isSelected ? 'text-green-900' : 'text-gray-900'
                            } ${viewType === 'grid' ? 'text-base' : 'text-sm'}`}>
                              {folder.name}
                            </h5>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(folder.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Browse Folder Button */}
                            <button
                              onClick={() => navigateToFolder(folder.id)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Browse folder contents"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* Process Folder Button */}
                            <button
                              onClick={() => processFolderBulk(folder)}
                              disabled={isProcessing}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={isSelected ? 'Remove folder from selection' : 'Process all resumes in this folder'}
                            >
                              {isProcessing ? (
                                <div className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Processing...</span>
                                </div>
                              ) : isSelected ? (
                                'Selected'
                              ) : (
                                'Process Folder'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              ) : (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Folders (0)
                  </h4>
                  <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p>No folders found in this location</p>
                    <p className="text-xs mt-1">
                      {currentFolder ? `"${currentFolder.name}" contains no subfolders` : 'Your Google Drive root has no folders'}
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Files */}
            {files.length === 0 && !loading && !hideEmptyState ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {viewMode === 'search'
                    ? 'No files found'
                    : !currentFolderId
                      ? 'Browse folders to find resume files'
                      : 'No files in this folder'
                  }
                </h4>
                <p className="text-gray-600">
                  {viewMode === 'search'
                    ? 'Try adjusting your search terms or browse folders directly'
                    : !currentFolderId
                      ? 'Click on any folder above to browse its contents and select resume files for processing.'
                      : showAllFiles
                        ? 'This folder is empty'
                        : 'No resume files found in this folder. Try enabling "Show all files" or navigate to a different folder.'
                  }
                </p>
              </div>
            ) : (
              <>
                {files.length > 0 && selectedFiles.length === 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {viewMode === 'search' ? 'Search Results' : 'Files'} ({totalFiles})
                      {!showAllFiles && (
                        <span className="text-xs text-gray-500">(resume files only)</span>
                      )}
                    </h4>

                    {/* Files Grid/List */}
                    <div className={`${
                      viewType === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
                        : 'space-y-2'
                    }`}>
                      {getPaginatedItems(files, currentPage, itemsPerPage).map((file) => {
                        const isSelected = selectedFiles.some(f => f.id === file.id);
                        const isSupported = googleDriveService.isFileTypeSupported(file.mimeType);

                        return (
                          <div
                            key={file.id}
                            onClick={() => isSupported && handleFileSelect(file)}
                            className={`rounded-lg border transition-all duration-200 cursor-pointer ${
                              viewType === 'grid' ? 'p-3' : 'p-4'
                            } ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : isSupported
                                ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <div className={`flex items-center ${
                              viewType === 'grid' ? 'flex-col text-center' : 'justify-between'
                            }`}>
                              <div className={`flex items-center gap-3 flex-1 min-w-0 ${
                                viewType === 'grid' ? 'flex-col' : ''
                              }`}>
                                <div className={`${viewType === 'grid' ? 'text-3xl mb-2' : 'text-2xl'}`}>
                                  {googleDriveService.getFileIcon(file.mimeType)}
                                </div>
                                <div className={`flex-1 min-w-0 ${viewType === 'grid' ? 'text-center' : ''}`}>
                                  <h4 className={`font-medium text-gray-900 ${
                                    viewType === 'grid' ? 'text-sm mb-1' : 'truncate'
                                  }`}>
                                    {viewType === 'grid' ?
                                      (file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name) :
                                      file.name
                                    }
                                  </h4>
                                  <div className={`text-xs text-gray-500 ${
                                    viewType === 'grid' ? 'space-y-1' : 'flex items-center gap-4 mt-1'
                                  }`}>
                                    <span>{googleDriveService.formatFileSize(file.size)}</span>
                                    {viewType === 'list' && <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>}
                                    {!isSupported && (
                                      <span className="text-red-500">Unsupported</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className={`text-blue-500 flex-shrink-0 ${
                                  viewType === 'grid' ? 'w-5 h-5 mt-2' : 'w-6 h-6'
                                }`} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Selected Folders Summary */}
            {selectedFolders.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Selected Folders for Bulk Processing ({selectedFolders.length})
                </h4>
                <div className="space-y-2">
                  {selectedFolders.map((folder) => (
                      <div key={folder.id} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-700">
                            {Math.floor(selectedFiles.length / selectedFolders.length)} files
                          </span>
                          <button
                            onClick={() => processFolderBulk(folder)}
                            className="text-xs text-green-600 hover:text-green-800"
                            title="Remove from selection"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Total: {selectedFiles.length} resume files</strong> ready for bulk processing
                  </p>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {(files.length > itemsPerPage || folders.length > itemsPerPage) && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, Math.max(files.length, folders.length))} to{' '}
                  {Math.min(currentPage * itemsPerPage, Math.max(files.length, folders.length))} of{' '}
                  {Math.max(files.length, folders.length)} items
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, getTotalPages(Math.max(files.length, folders.length), itemsPerPage)) }, (_, i) => {
                    const totalPages = getTotalPages(Math.max(files.length, folders.length), itemsPerPage);
                    let pageNum;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages(Math.max(files.length, folders.length), itemsPerPage)}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Selected files summary */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="mt-2 text-sm text-blue-600">
                  {selectedFiles.slice(0, 3).map(file => file.name).join(', ')}
                  {selectedFiles.length > 3 && ` and ${selectedFiles.length - 3} more...`}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
