"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle, Archive, Files, File, Loader2, CloudUpload, Zap, Cloud } from "lucide-react";
import { EnhancedGoogleDrivePicker } from './EnhancedGoogleDrivePicker';
import { googleDriveService, GoogleDriveFile } from '@/lib/services/googleDriveServices';
import GoogleDriveService from '@/lib/services/googleDriveServices';

interface ResumeUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

type UploadMode = 'single' | 'multiple' | 'zip' | 'google-drive';

export function ResumeUpload({ onFilesUploaded }: ResumeUploadProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('google-drive');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [zipContents, setZipContents] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedGoogleDriveFiles, setSelectedGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [googleDriveUploading, setGoogleDriveUploading] = useState(false);

  const allowedTypes = useMemo(() => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], []);
  const allowedZipTypes = useMemo(() => ['application/zip', 'application/x-zip-compressed'], []);
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxZipSize = 50 * 1024 * 1024; // 50MB

  // Handle Google Drive OAuth callback
  useEffect(() => {
    const accessToken = GoogleDriveService.handleOAuthCallback();
    if (accessToken) {
      GoogleDriveService.storeAccessToken(accessToken);
      googleDriveService.setAccessToken(accessToken);
      setUploadMode('google-drive');
    }
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check if it's a ZIP file
    if (allowedZipTypes.includes(file.type) || file.name.toLowerCase().endsWith('.zip')) {
      if (uploadMode !== 'zip') {
        return `${file.name}: ZIP files are only allowed in ZIP upload mode`;
      }
      if (file.size > maxZipSize) {
        return `${file.name}: ZIP file size must be less than 50MB`;
      }
      return null;
    }

    // Check regular resume files
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Only PDF, DOC, and DOCX files are allowed`;
    }
    if (file.size > maxFileSize) {
      return `${file.name}: File size must be less than 10MB`;
    }

    // In single mode, only allow one file
    if (uploadMode === 'single' && selectedFiles.length >= 1) {
      return `Single upload mode: Only one file allowed at a time`;
    }

    return null;
  }, [uploadMode, selectedFiles.length, allowedTypes, allowedZipTypes, maxFileSize, maxZipSize]);

  // Function to simulate ZIP file extraction (in real app, this would use a ZIP library)
   
  const processZipFile = async (_zipFile: File): Promise<File[]> => {
    // Mock ZIP processing - in real implementation, use JSZip or similar
    const mockFiles: File[] = [];
    const fileCount = Math.floor(Math.random() * 5) + 2; // 2-6 files

    for (let i = 0; i < fileCount; i++) {
      const mockFileName = `resume_${i + 1}.pdf`;
      const mockFileSize = Math.floor(Math.random() * 2000000) + 500000; // 0.5-2.5MB

      // Create a mock file object that mimics the File interface
      const mockFile = {
        name: mockFileName,
        size: mockFileSize,
        type: 'application/pdf',
        lastModified: Date.now(),
        webkitRelativePath: '',
        stream: () => new ReadableStream(),
        text: () => Promise.resolve('mock content'),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        slice: () => new Blob()
      } as File;

      mockFiles.push(mockFile);
    }

    return mockFiles;
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
        continue;
      }

      // Handle ZIP files
      if (allowedZipTypes.includes(file.type) || file.name.toLowerCase().endsWith('.zip')) {
        try {
          const extractedFiles = await processZipFile(file);
          setZipContents(extractedFiles);
          validFiles.push(...extractedFiles);
        } catch {
          newErrors.push(`${file.name}: Failed to extract ZIP file`);
        }
      } else {
        validFiles.push(file);
      }
    }

    setErrors(newErrors);
    if (validFiles.length > 0) {
      if (uploadMode === 'single') {
        setSelectedFiles([validFiles[0]]); // Only keep the first file in single mode
      } else {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
    }
  }, [uploadMode, allowedZipTypes, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateUpload = async (file: File): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      }, 200);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setErrors([]);

    try {
      // Simulate upload process
      for (const file of selectedFiles) {
        await simulateUpload(file);
      }

      // Call the callback with uploaded files
      onFilesUploaded(selectedFiles);

      // Show success state
      setUploadSuccess(true);

      // Clear selected files after a delay
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        setUploadSuccess(false);
        setZipContents([]);
      }, 2000);
    } catch {
      setErrors(['Upload failed. Please try again.']);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Google Drive file upload
  const handleGoogleDriveUpload = async () => {
    if (selectedGoogleDriveFiles.length === 0) return;

    setGoogleDriveUploading(true);
    setErrors([]);

    try {
      const uploadPromises = selectedGoogleDriveFiles.map(async (file) => {
        try {
          const response = await googleDriveService.uploadResume(file.id);
          return {
            name: file.name,
            success: true,
            data: response
          };
        } catch (error) {
          return {
            name: file.name,
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
          };
        }
      });

      const results = await Promise.all(uploadPromises);

      // Check for errors
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        setErrors(failedUploads.map(f => `${f.name}: ${f.error}`));
      }

      // Get successful uploads
      const successfulUploads = results.filter(r => r.success);
      if (successfulUploads.length > 0) {
        setUploadSuccess(true);

        // Convert Google Drive files to File objects for callback
        // This is a simplified conversion - in a real app you might want to handle this differently
        const mockFiles = successfulUploads.map(result => {
          const file = selectedGoogleDriveFiles.find(f => f.name === result.name);
          // Create a mock File object
          const mockFile = {
            name: file?.name || 'unknown',
            size: parseInt(file?.size || '0'),
            type: 'application/pdf',
            lastModified: Date.now(),
          } as File;
          return mockFile;
        });

        onFilesUploaded(mockFiles);

        // Clear selection after delay
        setTimeout(() => {
          setSelectedGoogleDriveFiles([]);
          setUploadSuccess(false);
        }, 2000);
      }

    } catch (error) {
      setErrors(['Failed to upload files from Google Drive. Please try again.']);
    } finally {
      setGoogleDriveUploading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Upload Mode Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Upload Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Google Drive Upload - FIRST */}
          <button
            onClick={() => {
              setUploadMode('google-drive');
              setSelectedFiles([]);
              setErrors([]);
              setZipContents([]);
              setSelectedGoogleDriveFiles([]);
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === 'google-drive'
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                uploadMode === 'google-drive' ? 'bg-blue-500' : 'bg-gray-100'
              }`}>
                <Cloud className={`w-4 h-4 ${uploadMode === 'google-drive' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <h4 className="font-medium text-gray-900">Google Drive</h4>
            </div>
            <p className="text-sm text-gray-600">Upload from your Google Drive</p>
          </button>

          {/* Single Upload */}
          <button
            onClick={() => {
              setUploadMode('single');
              setSelectedFiles([]);
              setErrors([]);
              setZipContents([]);
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === 'single'
                ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                uploadMode === 'single' ? 'bg-yellow-500' : 'bg-gray-100'
              }`}>
                <File className={`w-4 h-4 ${uploadMode === 'single' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <h4 className="font-medium text-gray-900">Single Upload</h4>
            </div>
            <p className="text-sm text-gray-600">Upload one resume at a time</p>
          </button>

          {/* Multiple Upload */}
          <button
            onClick={() => {
              setUploadMode('multiple');
              setErrors([]);
              setZipContents([]);
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === 'multiple'
                ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                uploadMode === 'multiple' ? 'bg-yellow-500' : 'bg-gray-100'
              }`}>
                <Files className={`w-4 h-4 ${uploadMode === 'multiple' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <h4 className="font-medium text-gray-900">Multiple Upload</h4>
            </div>
            <p className="text-sm text-gray-600">Upload multiple resumes at once</p>
          </button>

          {/* ZIP Upload */}
          <button
            onClick={() => {
              setUploadMode('zip');
              setSelectedFiles([]);
              setErrors([]);
              setZipContents([]);
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
              uploadMode === 'zip'
                ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                uploadMode === 'zip' ? 'bg-yellow-500' : 'bg-gray-100'
              }`}>
                <Archive className={`w-4 h-4 ${uploadMode === 'zip' ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <h4 className="font-medium text-gray-900">ZIP Upload</h4>
            </div>
            <p className="text-sm text-gray-600">Upload a ZIP file containing multiple resumes</p>
          </button>


        </div>
      </div>

      {/* Upload Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              {uploadMode === 'google-drive' && 'Google Drive Upload Instructions'}
              {uploadMode === 'single' && 'Single Upload Instructions'}
              {uploadMode === 'multiple' && 'Multiple Upload Instructions'}
              {uploadMode === 'zip' && 'ZIP Upload Instructions'}
            </h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              {uploadMode === 'google-drive' && (
                <>
                  <li>• Connect to your Google Drive account</li>
                  <li>• Browse and select resume files from your Drive</li>
                  <li>• Supported formats: PDF, DOC, DOCX</li>
                  <li>• Files are downloaded and processed securely</li>
                </>
              )}
              {uploadMode === 'single' && (
                <>
                  <li>• Upload one resume file (PDF, DOC, DOCX)</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Perfect for individual candidate processing</li>
                </>
              )}
              {uploadMode === 'multiple' && (
                <>
                  <li>• Upload multiple resume files at once</li>
                  <li>• Supported formats: PDF, DOC, DOCX</li>
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• Drag & drop multiple files or select them</li>
                </>
              )}
              {uploadMode === 'zip' && (
                <>
                  <li>• Upload a ZIP file containing resume files</li>
                  <li>• ZIP file should contain PDF, DOC, or DOCX files</li>
                  <li>• Maximum ZIP size: 50MB</li>
                  <li>• Files will be automatically extracted and processed</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone - Only for non-Google Drive modes */}
      {uploadMode !== 'google-drive' && (
        <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 transform ${
          isDragOver
            ? 'border-yellow-400 bg-yellow-50 scale-105 shadow-lg'
            : uploadSuccess
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          multiple={uploadMode !== 'single'}
          accept={uploadMode === 'zip' ? '.zip' : '.pdf,.doc,.docx'}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 ${
            isDragOver
              ? 'bg-yellow-200 scale-110'
              : uploadSuccess
              ? 'bg-green-200'
              : 'bg-yellow-100'
          }`}>
            {uploadSuccess ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : isDragOver ? (
              <CloudUpload className="w-8 h-8 text-yellow-600 animate-bounce" />
            ) : uploadMode === 'zip' ? (
              <Archive className="w-8 h-8 text-yellow-600" />
            ) : (
              <Upload className="w-8 h-8 text-yellow-600" />
            )}
          </div>

          <div>
            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
              isDragOver
                ? 'text-yellow-700'
                : uploadSuccess
                ? 'text-green-700'
                : 'text-gray-900'
            }`}>
              {uploadSuccess ? (
                'Files uploaded successfully!'
              ) : isDragOver ? (
                'Release to upload files'
              ) : (
                <>
                  {uploadMode === 'single' && 'Drop your resume file here'}
                  {uploadMode === 'multiple' && 'Drop your resume files here'}
                  {uploadMode === 'zip' && 'Drop your ZIP file here'}
                </>
              )}
            </h3>
            {!uploadSuccess && (
              <>
                <p className={`mb-4 transition-colors duration-300 ${
                  isDragOver ? 'text-yellow-700' : 'text-gray-600'
                }`}>
                  or <span className="text-yellow-600 font-medium">browse</span> to choose
                  {uploadMode === 'single' ? ' a file' : uploadMode === 'zip' ? ' a ZIP file' : ' files'}
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  isDragOver ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {uploadMode === 'single' && 'Supports PDF, DOC, DOCX • Max 10MB'}
                  {uploadMode === 'multiple' && 'Supports PDF, DOC, DOCX • Max 10MB per file'}
                  {uploadMode === 'zip' && 'Supports ZIP files • Max 50MB'}
                </p>
              </>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Google Drive Picker */}
      {uploadMode === 'google-drive' && (
        <EnhancedGoogleDrivePicker
          onFilesSelected={setSelectedGoogleDriveFiles}
          onAuthRequired={() => {
            setErrors(['Google Drive authentication required. Please try again.']);
          }}
          multiSelect={true}
          className="mb-6"
        />
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-2">Upload Errors</h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ZIP Contents Preview */}
      {uploadMode === 'zip' && zipContents.length > 0 && (
        <div className="mt-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">ZIP File Extracted Successfully</h4>
            </div>
            <p className="text-sm text-green-700">
              Found {zipContents.length} resume files in the ZIP archive
            </p>
          </div>

          <h4 className="font-medium text-gray-900 mb-4">
            Extracted Files ({zipContents.length})
          </h4>
          <div className="space-y-3 mb-4">
            {zipContents.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">{file.name}</p>
                    <p className="text-xs text-blue-700">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  From ZIP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files or Google Drive Files */}
      {(selectedFiles.length > 0 || (uploadMode === 'google-drive' && selectedGoogleDriveFiles.length > 0)) && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">
            {uploadMode === 'zip' ? 'Ready to Upload' : uploadMode === 'google-drive' ? 'Selected from Google Drive' : 'Selected Files'}
            ({uploadMode === 'google-drive' ? selectedGoogleDriveFiles.length : selectedFiles.length})
          </h4>
          <div className="space-y-3">
            {/* Regular Files */}
            {uploadMode !== 'google-drive' && selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {uploadProgress[file.name] !== undefined ? (
                    <div className="flex items-center gap-3">
                      {uploadProgress[file.name] === 100 ? (
                        <div className="flex items-center gap-2 animate-bounce">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium text-green-600">Complete!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 relative">
                            <div className="w-full h-full rounded-full border-2 border-gray-200"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-medium text-yellow-600">
                                {Math.round(uploadProgress[file.name] || 0)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress[file.name] || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">
                              Uploading... {Math.round(uploadProgress[file.name] || 0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Google Drive Files */}
            {uploadMode === 'google-drive' && selectedGoogleDriveFiles.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">{file.name}</h5>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{googleDriveService.formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>Google Drive</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {googleDriveUploading ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                      </div>
                      <span className="text-sm text-blue-600">Uploading...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedGoogleDriveFiles(prev => prev.filter(f => f.id !== file.id));
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={uploadMode === 'google-drive' ? handleGoogleDriveUpload : handleUpload}
              disabled={
                (uploadMode === 'google-drive' ? googleDriveUploading : isUploading) ||
                Object.keys(uploadProgress).length > 0 ||
                uploadSuccess
              }
              className={`px-6 py-3 font-medium rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 ${
                uploadSuccess
                  ? 'bg-green-500 text-white'
                  : (uploadMode === 'google-drive' ? googleDriveUploading : isUploading)
                  ? (uploadMode === 'google-drive' ? 'bg-blue-400 text-white' : 'bg-yellow-400 text-white')
                  : (uploadMode === 'google-drive' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-yellow-500 text-white hover:bg-yellow-600')
              } ${(uploadMode === 'google-drive' ? googleDriveUploading : isUploading) ? 'animate-pulse' : ''}`}
            >
              {uploadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Upload Complete!
                </>
              ) : (uploadMode === 'google-drive' ? googleDriveUploading : isUploading) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadMode === 'google-drive' ? 'Processing from Drive...' : 'Uploading...'}
                </>
              ) : (
                <>
                  {uploadMode === 'google-drive' ? <Cloud className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {uploadMode === 'google-drive'
                    ? `Process ${selectedGoogleDriveFiles.length} File${selectedGoogleDriveFiles.length !== 1 ? 's' : ''} from Drive`
                    : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                  }
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
