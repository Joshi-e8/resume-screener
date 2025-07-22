"use client";

import { useState } from "react";
import { ArrowLeft, Upload, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ResumeUpload } from "@/components/resumes/ResumeUpload";
import { useToast } from "@/components/ui/Toast";
import { LinearProgress } from "@/components/ui/ProgressIndicator";
import { useShortcut } from "@/components/ui/KeyboardShortcuts";

export default function ResumeUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    showToast({
      type: 'success',
      title: 'Files uploaded successfully',
      message: `${files.length} file(s) have been uploaded and are being processed.`
    });

    // Simulate processing progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Keyboard shortcuts
  useShortcut('ctrl+u', () => {
    // Focus upload area or trigger upload
    const uploadButton = document.querySelector('[data-upload-trigger]') as HTMLElement;
    if (uploadButton) uploadButton.click();
  }, {
    description: 'Upload files',
    category: 'Resume Management',
    dependencies: []
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/resumes"
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Upload Resumes
          </h1>
          <p className="text-gray-600 mt-1">
            Upload candidate resumes for processing and analysis
          </p>
        </div>
      </div>

      {/* Upload Options Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-blue-900">Single Upload</h3>
          </div>
          <p className="text-blue-800 text-sm">
            Upload one resume at a time for focused processing and review.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-green-900">Multiple Upload</h3>
          </div>
          <p className="text-green-800 text-sm">
            Upload multiple resume files simultaneously for batch processing.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-purple-900">ZIP Upload</h3>
          </div>
          <p className="text-purple-800 text-sm">
            Upload a ZIP archive containing multiple resumes for bulk import.
          </p>
        </div>
      </div>

      {/* Upload Component */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <ResumeUpload onFilesUploaded={handleFilesUploaded} />
      </div>

      {/* Upload Progress/Results */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <LinearProgress
              value={uploadProgress}
              label="Processing"
              className="w-48"
              size="sm"
            />
          </div>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Uploaded
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              Files are being processed. You can continue uploading or return to the resume list.
            </div>
            <Link
              href="/dashboard/resumes"
              className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-all duration-200"
            >
              View All Resumes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
