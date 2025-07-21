"use client";

import { useState, useCallback, useMemo } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle, Archive, Files, File } from "lucide-react";

interface ResumeUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

type UploadMode = 'single' | 'multiple' | 'zip';

export function ResumeUpload({ onFilesUploaded }: ResumeUploadProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('multiple');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [zipContents, setZipContents] = useState<File[]>([]);

  const allowedTypes = useMemo(() => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], []);
  const allowedZipTypes = useMemo(() => ['application/zip', 'application/x-zip-compressed'], []);
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxZipSize = 50 * 1024 * 1024; // 50MB

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Simulate upload process
    for (const file of selectedFiles) {
      await simulateUpload(file);
    }

    // Call the callback with uploaded files
    onFilesUploaded(selectedFiles);
    
    // Clear selected files
    setSelectedFiles([]);
    setUploadProgress({});
  };

  return (
    <div className="p-6">
      {/* Upload Mode Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Upload Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Single Upload */}
          <button
            onClick={() => {
              setUploadMode('single');
              setSelectedFiles([]);
              setErrors([]);
              setZipContents([]);
            }}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              uploadMode === 'single'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
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
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              uploadMode === 'multiple'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
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
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              uploadMode === 'zip'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
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
              {uploadMode === 'single' && 'Single Upload Instructions'}
              {uploadMode === 'multiple' && 'Multiple Upload Instructions'}
              {uploadMode === 'zip' && 'ZIP Upload Instructions'}
            </h4>
            <ul className="text-blue-800 space-y-1 text-sm">
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

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-300 hover:border-gray-400'
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
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto">
            {uploadMode === 'zip' ? (
              <Archive className="w-8 h-8 text-yellow-600" />
            ) : (
              <Upload className="w-8 h-8 text-yellow-600" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {uploadMode === 'single' && 'Drop your resume file here'}
              {uploadMode === 'multiple' && 'Drop your resume files here'}
              {uploadMode === 'zip' && 'Drop your ZIP file here'}
            </h3>
            <p className="text-gray-600 mb-4">
              or <span className="text-yellow-600 font-medium">browse</span> to choose
              {uploadMode === 'single' ? ' a file' : uploadMode === 'zip' ? ' a ZIP file' : ' files'}
            </p>
            <p className="text-sm text-gray-500">
              {uploadMode === 'single' && 'Supports PDF, DOC, DOCX • Max 10MB'}
              {uploadMode === 'multiple' && 'Supports PDF, DOC, DOCX • Max 10MB per file'}
              {uploadMode === 'zip' && 'Supports ZIP files • Max 50MB'}
            </p>
          </div>
        </div>
      </div>

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

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">
            {uploadMode === 'zip' ? 'Ready to Upload' : 'Selected Files'} ({selectedFiles.length})
          </h4>
          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
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
                    <div className="flex items-center gap-2">
                      {uploadProgress[file.name] === 100 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-8 h-8 relative">
                          <div className="w-full h-full rounded-full border-2 border-gray-200"></div>
                          <div 
                            className="absolute inset-0 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin"
                            style={{ 
                              background: `conic-gradient(#eab308 ${uploadProgress[file.name]}%, transparent 0)` 
                            }}
                          ></div>
                        </div>
                      )}
                      <span className="text-sm text-gray-600">
                        {Math.round(uploadProgress[file.name] || 0)}%
                      </span>
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
          </div>

          {/* Upload Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={Object.keys(uploadProgress).length > 0}
              className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
