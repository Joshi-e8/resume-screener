"use client";

import React, { useState } from 'react';
import { EnhancedGoogleDrivePicker } from '@/components/resumes/EnhancedGoogleDrivePicker';
import { GoogleDriveFile } from '@/lib/services/googleDriveServices';

export default function GoogleDriveBrowserDemo() {
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);

  const handleFilesSelected = (files: GoogleDriveFile[]) => {
    setSelectedFiles(files);
    console.log('Selected files:', files);
  };

  const handleAuthRequired = () => {
    console.log('Authentication required');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Drive Browser Demo
          </h1>
          <p className="text-gray-600">
            Browse your Google Drive folders and select resume files for upload.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Google Drive Browser */}
          <div className="lg:col-span-2">
            <EnhancedGoogleDrivePicker
              onFilesSelected={handleFilesSelected}
              onAuthRequired={handleAuthRequired}
              multiSelect={true}
              className="h-fit"
            />
          </div>

          {/* Selected Files Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected Files ({selectedFiles.length})
              </h3>
              
              {selectedFiles.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No files selected. Browse your Google Drive and select resume files to see them here.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{file.mimeType.split('/').pop()?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : 'Unknown size'}</span>
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                    Process Selected Files
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Enhanced Google Drive Integration Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📁 Folder Navigation</h3>
              <p className="text-blue-700 text-sm">
                Browse through your Google Drive folder structure with intuitive navigation and breadcrumbs.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">🔍 Smart Search</h3>
              <p className="text-green-700 text-sm">
                Search specifically for resume files across your entire Google Drive with targeted filtering.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">🎯 File Filtering</h3>
              <p className="text-purple-700 text-sm">
                Toggle between showing only resume files (PDF, DOC, DOCX) or all files in your Drive.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">✅ Multi-Selection</h3>
              <p className="text-orange-700 text-sm">
                Select multiple resume files at once for batch processing and upload.
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">🔄 Real-time Sync</h3>
              <p className="text-red-700 text-sm">
                Always see the latest files from your Google Drive with refresh capabilities.
              </p>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">🔐 Secure Access</h3>
              <p className="text-indigo-700 text-sm">
                OAuth 2.0 authentication ensures secure access to your Google Drive files.
              </p>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mt-8 bg-gray-900 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Available API Endpoints</h2>
          
          <div className="space-y-4 font-mono text-sm">
            <div className="p-3 bg-gray-800 rounded-lg">
              <span className="text-green-400">GET</span> <span className="text-blue-400">/api/v1/google-drive/browse</span>
              <p className="text-gray-300 mt-1 text-xs">Browse folders and files with navigation support</p>
            </div>
            
            <div className="p-3 bg-gray-800 rounded-lg">
              <span className="text-green-400">GET</span> <span className="text-blue-400">/api/v1/google-drive/search-resumes</span>
              <p className="text-gray-300 mt-1 text-xs">Search specifically for resume files</p>
            </div>
            
            <div className="p-3 bg-gray-800 rounded-lg">
              <span className="text-yellow-400">POST</span> <span className="text-blue-400">/api/v1/google-drive/upload-resume</span>
              <p className="text-gray-300 mt-1 text-xs">Upload and process selected resume files</p>
            </div>
            
            <div className="p-3 bg-gray-800 rounded-lg">
              <span className="text-green-400">GET</span> <span className="text-blue-400">/api/v1/google-drive/validate-token</span>
              <p className="text-gray-300 mt-1 text-xs">Validate Google Drive access token</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
