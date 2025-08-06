"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Settings,
  Zap
} from 'lucide-react';
import { googleDriveService, GoogleDriveFile, GoogleDriveFolder } from '@/lib/services/googleDriveServices';
import GoogleDriveService from '@/lib/services/googleDriveServices';
import { VirtualizedFileList } from './VirtualizedFileList';

interface HighPerformanceGoogleDrivePickerProps {
  onFilesSelected: (files: GoogleDriveFile[]) => void;
  onAuthRequired: () => void;
  multiSelect?: boolean;
  className?: string;
  maxFiles?: number;
  enableVirtualization?: boolean;
  performanceMode?: boolean;
}

type ViewMode = 'browse' | 'search';
type PerformanceLevel = 'standard' | 'optimized' | 'maximum';

export const HighPerformanceGoogleDrivePicker: React.FC<HighPerformanceGoogleDrivePickerProps> = ({
  onFilesSelected,
  onAuthRequired,
  multiSelect = true,
  className = '',
  maxFiles = 10000,
  enableVirtualization = true,
  performanceMode = false
}) => {
  // File and folder state
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  
  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<GoogleDriveFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<GoogleDriveFolder[]>([]);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [showAllFiles, setShowAllFiles] = useState(false);
  
  // Performance settings
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>(
    performanceMode ? 'maximum' : 'standard'
  );
  const [batchSize, setBatchSize] = useState(100);
  const [useVirtualization, setUseVirtualization] = useState(enableVirtualization);
  
  // Performance monitoring
  const [loadTime, setLoadTime] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoized filtered and sorted files
  const processedFiles = useMemo(() => {
    let result = [...files];
    
    // Apply search filter if in search mode
    if (viewMode === 'search' && debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }
    
    // Sort files
    result.sort((a, b) => {
      // Prioritize supported file types
      const aSupported = googleDriveService.isFileTypeSupported(a.mimeType);
      const bSupported = googleDriveService.isFileTypeSupported(b.mimeType);
      
      if (aSupported !== bSupported) {
        return bSupported ? 1 : -1;
      }
      
      // Then sort by name
      return a.name.localeCompare(b.name);
    });
    
    return result;
  }, [files, debouncedSearchQuery, viewMode]);

  // Performance-optimized browse function
  const browseFolder = useCallback(async (folderId?: string) => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);
    setViewMode('browse');

    try {
      const response = await googleDriveService.browseFolder(folderId, showAllFiles);
      
      setFiles(response.files);
      setFolders(response.folders);
      setTotalFiles(response.files.length);
      setCurrentFolderId(folderId || null);
      setCurrentFolder(response.current_folder || null);
      setBreadcrumbs(response.breadcrumbs);
      setParentFolderId(response.parent_folder_id || null);
      
      setLoadTime(Date.now() - startTime);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to browse folder';
      setError(errorMessage);
      setFiles([]);
      setFolders([]);
      setTotalFiles(0);

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

  // Performance-optimized search
  const searchResumes = useCallback(async (query: string) => {
    if (!query.trim()) {
      browseFolder(currentFolderId || undefined);
      return;
    }

    const startTime = Date.now();
    setLoading(true);
    setError(null);
    setViewMode('search');

    try {
      const response = await googleDriveService.searchResumes(query);
      setFiles(response.files);
      setFolders([]);
      setTotalFiles(response.files.length);
      setLoadTime(Date.now() - startTime);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search files';
      setError(errorMessage);
      setFiles([]);
      setFolders([]);
      setTotalFiles(0);
    } finally {
      setLoading(false);
    }
  }, [browseFolder, currentFolderId]);

  // Handle search with debouncing
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchResumes(debouncedSearchQuery);
    } else if (viewMode === 'search') {
      browseFolder(currentFolderId || undefined);
    }
  }, [debouncedSearchQuery, searchResumes, browseFolder, currentFolderId, viewMode]);

  // File selection with performance optimization
  const handleFileSelect = useCallback((file: GoogleDriveFile) => {
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
  }, [multiSelect, onFilesSelected]);

  // Navigation handlers
  const navigateToFolder = useCallback((folderId: string) => {
    browseFolder(folderId);
  }, [browseFolder]);

  const navigateToParent = useCallback(() => {
    if (parentFolderId) {
      browseFolder(parentFolderId);
    } else {
      browseFolder();
    }
  }, [browseFolder, parentFolderId]);

  const navigateToRoot = useCallback(() => {
    browseFolder();
  }, [browseFolder]);

  // Performance level adjustment
  const adjustPerformanceLevel = useCallback((level: PerformanceLevel) => {
    setPerformanceLevel(level);
    
    switch (level) {
      case 'standard':
        setBatchSize(50);
        setUseVirtualization(false);
        break;
      case 'optimized':
        setBatchSize(100);
        setUseVirtualization(true);
        break;
      case 'maximum':
        setBatchSize(200);
        setUseVirtualization(true);
        break;
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
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
          }
        } catch (error) {
          GoogleDriveService.removeStoredAccessToken();
          googleDriveService.clearAccessToken();
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      browseFolder();
    }
  }, [isAuthenticated, browseFolder]);

  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-8 text-center ${className}`}>
        <Cloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect to Google Drive
        </h3>
        <p className="text-gray-600 mb-6">
          High-performance browsing for large resume collections.
        </p>
        <button
          onClick={onAuthRequired}
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
      {/* Header with Performance Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-500" />
            High-Performance Drive Browser
            {performanceLevel === 'maximum' && <Zap className="w-5 h-5 text-yellow-500" />}
          </h3>
          
          <div className="flex items-center gap-2">
            {/* Performance Level Selector */}
            <select
              value={performanceLevel}
              onChange={(e) => adjustPerformanceLevel(e.target.value as PerformanceLevel)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white"
              title="Performance Level"
            >
              <option value="standard">Standard</option>
              <option value="optimized">Optimized</option>
              <option value="maximum">Maximum</option>
            </select>
            
            <button
              onClick={() => setShowAllFiles(prev => !prev)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                showAllFiles 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showAllFiles ? 'Show only resume files' : 'Show all files'}
            >
              {showAllFiles ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Performance Stats */}
        {(loadTime > 0 || totalFiles > 100) && (
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>Load time: {loadTime}ms</span>
            <span>Files: {totalFiles.toLocaleString()}</span>
            <span>Mode: {useVirtualization ? 'Virtualized' : 'Standard'}</span>
            {performanceLevel === 'maximum' && <span className="text-yellow-600">⚡ Max Performance</span>}
          </div>
        )}
      </div>

      {/* Navigation Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={navigateToRoot}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Drive</span>
            </button>

            {breadcrumbs.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateToFolder(folder.id)}
                  className="text-blue-600 hover:text-blue-700 transition-colors truncate max-w-32"
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}

            {parentFolderId && (
              <button
                onClick={navigateToParent}
                className="ml-4 flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-700 bg-white rounded border border-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">
                {viewMode === 'search' ? 'Searching files...' : 'Loading folder contents...'}
              </p>
              {totalFiles > 1000 && (
                <p className="text-sm text-gray-500 mt-2">
                  Large dataset detected - using performance optimizations
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Folders */}
            {viewMode === 'browse' && folders.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Folders ({folders.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-6 h-6 text-blue-500 group-hover:text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate group-hover:text-blue-900 text-sm">
                            {folder.name}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(folder.modifiedTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {processedFiles.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {viewMode === 'search' ? 'Search Results' : 'Files'} ({processedFiles.length.toLocaleString()})
                    {!showAllFiles && (
                      <span className="text-xs text-gray-500">(resume files only)</span>
                    )}
                  </h4>

                  {processedFiles.length > 100 && (
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Settings className="w-3 h-3" />
                      {useVirtualization ? 'Virtualized rendering' : 'Standard rendering'}
                    </div>
                  )}
                </div>

                {/* Use virtualized list for large datasets */}
                {useVirtualization && processedFiles.length > 50 ? (
                  <VirtualizedFileList
                    files={processedFiles}
                    selectedFiles={selectedFiles}
                    onFileSelect={handleFileSelect}
                    height={Math.min(600, Math.max(300, processedFiles.length * 80))}
                    searchQuery={debouncedSearchQuery}
                  />
                ) : (
                  /* Standard list for smaller datasets */
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {processedFiles.slice(0, batchSize).map((file) => {
                      const isSelected = selectedFiles.some(f => f.id === file.id);
                      const isSupported = googleDriveService.isFileTypeSupported(file.mimeType);

                      return (
                        <div
                          key={file.id}
                          onClick={() => isSupported && handleFileSelect(file)}
                          className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : isSupported
                              ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-xl">
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
                                    <span className="text-red-500 text-xs">Unsupported</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {processedFiles.length > batchSize && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Showing {batchSize} of {processedFiles.length} files
                        </p>
                        <button
                          onClick={() => setBatchSize(prev => prev + 100)}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {viewMode === 'search' ? 'No files found' : 'No files in this folder'}
                  </h4>
                  <p className="text-gray-600">
                    {viewMode === 'search'
                      ? 'Try adjusting your search terms or browse different folders'
                      : 'This folder appears to be empty'
                    }
                  </p>
                </div>
              )
            )}

            {/* Selected files summary */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                  {selectedFiles.length >= 10 && (
                    <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                      Bulk selection
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-blue-600">
                  {selectedFiles.slice(0, 3).map(file => file.name).join(', ')}
                  {selectedFiles.length > 3 && ` and ${selectedFiles.length - 3} more...`}
                </div>
                {selectedFiles.length > 10 && (
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Clear all selections
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
