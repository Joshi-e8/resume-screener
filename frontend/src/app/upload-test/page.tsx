"use client";

import { useState } from "react";
import { ArrowLeft, Upload, FileText, AlertCircle, Cloud, Play } from "lucide-react";
import Link from "next/link";
import { SSEProgressBar } from "@/components/ui/SSEProgressBar";
import { LinearProgress } from "@/components/ui/ProgressIndicator";

export default function UploadTestPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };

  const simulateUpload = () => {
    if (isProcessing || uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    setProgress({
      completed: 0,
      total: uploadedFiles.length,
      status: 'processing',
      message: 'Starting upload...'
    });

    const stages = [
      { completed: 0, message: 'Uploading files...', delay: 1000 },
      { completed: 1, message: `Parsing ${uploadedFiles[0]?.name || 'file'}...`, filename: uploadedFiles[0]?.name, delay: 2000 },
      { completed: Math.floor(uploadedFiles.length / 2), message: 'Analyzing content...', delay: 2500 },
      { completed: uploadedFiles.length - 1, message: 'Creating vector embeddings...', delay: 2000 },
      { completed: uploadedFiles.length, message: 'Processing complete!', delay: 1000, status: 'completed', successful_files: uploadedFiles.length, failed_files: 0, processing_time_ms: 8500 }
    ];

    let currentStage = 0;
    const runNextStage = () => {
      if (currentStage >= stages.length) {
        setIsProcessing(false);
        return;
      }

      const stage = stages[currentStage];
      setProgress({
        completed: stage.completed,
        total: uploadedFiles.length,
        status: stage.status || 'processing',
        message: stage.message,
        filename: stage.filename,
        successful_files: stage.successful_files,
        failed_files: stage.failed_files,
        processing_time_ms: stage.processing_time_ms
      });

      currentStage++;
      if (currentStage < stages.length) {
        setTimeout(runNextStage, stage.delay);
      } else {
        setIsProcessing(false);
      }
    };

    setTimeout(runNextStage, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Resume Upload with SSE Progress
              </h1>
              <p className="text-gray-600 mt-1">
                Test the SSE progress bar with real file uploads (no authentication required)
              </p>
            </div>
          </div>
        </div>

        {/* Upload Interface */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Files</h2>
          
          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Resume Files
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Selected Files */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Selected Files ({uploadedFiles.length})
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {uploadedFiles.length > 0 && !isProcessing && (
            <button
              onClick={simulateUpload}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Play className="w-5 h-5" />
              Start Processing
            </button>
          )}
        </div>

        {/* SSE Progress Bar */}
        {isProcessing && progress && (
          <div className="mb-8">
            <SSEProgressBar
              progress={progress}
              title="Processing Resume Files"
              showDetails={true}
              showFileProgress={true}
              onComplete={() => {
                console.log('🎉 Processing completed!');
                setIsProcessing(false);
              }}
              onError={(error) => {
                console.error('❌ Processing error:', error);
                setIsProcessing(false);
              }}
            />
          </div>
        )}

        {/* Results */}
        {progress?.status === 'completed' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Processing Complete!</h3>
                <p className="text-sm text-gray-600">
                  {progress.successful_files} files processed successfully
                </p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ All files have been processed and are ready for review.
                Processing time: {((progress.processing_time_ms || 0) / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Select one or more resume files using the file input above</li>
            <li>Click "Start Processing" to begin the simulation</li>
            <li>Watch the SSE progress bar show real-time updates</li>
            <li>Observe the different processing stages and file-level progress</li>
            <li>See the completion summary when processing finishes</li>
          </ol>
          <div className="mt-4 p-3 bg-white/50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>💡 Note:</strong> This is a simulation that demonstrates how the SSE progress bar 
              will look during actual resume processing. The real implementation connects to backend 
              processing via Server-Sent Events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
