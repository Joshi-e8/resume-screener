"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, File, X, Check, AlertCircle } from "lucide-react";

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface DragDropUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  onFilesSelected?: (files: File[]) => void;

  className?: string;
  disabled?: boolean;
}

export function DragDropUpload({
  accept = ".pdf,.doc,.docx",
  multiple = true,
  maxSize = 10,
  maxFiles = 10,
  onFilesSelected,
  className = "",
  disabled = false
}: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    if (accept && !accept.split(',').some(type => 
      file.type.includes(type.replace('.', '')) || file.name.toLowerCase().endsWith(type)
    )) {
      return `File type not supported. Accepted types: ${accept}`;
    }

    return null;
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    const validFiles: File[] = [];

    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        return;
      }

      const error = validateFile(file);
      const fileWithPreview: FileWithPreview = {
        ...file,
        id: Math.random().toString(36).substring(2, 9),
        status: error ? 'error' : 'uploading',
        progress: error ? 0 : 0,
        error: error || undefined
      };

      newFiles.push(fileWithPreview);
      
      if (!error) {
        validFiles.push(file);
      }
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    if (validFiles.length > 0) {
      onFilesSelected?.(validFiles);
      
      // Simulate upload progress
      newFiles.forEach((file, index) => {
        if (!file.error) {
          simulateUpload(file.id, index * 500);
        }
      });
    }
  };

  const simulateUpload = (fileId: string, delay: number = 0) => {
    setTimeout(() => {
      const interval = setInterval(() => {
        setFiles(prev => prev.map(file => {
          if (file.id === fileId && file.status === 'uploading') {
            const newProgress = Math.min(file.progress + Math.random() * 30, 100);
            
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...file, progress: 100, status: 'success' };
            }
            
            return { ...file, progress: newProgress };
          }
          return file;
        }));
      }, 200);
    }, delay);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-yellow-500 bg-yellow-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200
            ${isDragOver ? 'bg-yellow-100' : 'bg-gray-100'}
          `}>
            <Upload className={`w-8 h-8 ${isDragOver ? 'text-yellow-600' : 'text-gray-600'}`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop files here' : 'Upload files'}
            </h3>
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports: {accept} • Max {maxSize}MB per file • Up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Uploaded Files ({files.length})
          </h4>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="text-2xl">
                  {getFileIcon(file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </h5>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">{file.error}</span>
                    </div>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-3 h-3" />
                      <span className="text-xs">Upload complete</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
