"use client";

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2, Clock, Zap, FileText, Upload } from 'lucide-react';
import { LinearProgress } from './ProgressIndicator';
import type { ProgressUpdate } from '@/lib/services/googleDriveServices';

interface SSEProgressBarProps {
  progress: ProgressUpdate | null;
  title?: string;
  showDetails?: boolean;
  showFileProgress?: boolean;
  className?: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function SSEProgressBar({
  progress,
  title = "Processing",
  showDetails = true,
  showFileProgress = true,
  className = "",
  onComplete,
  onError
}: SSEProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [processingStage, setProcessingStage] = useState<string>("");
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update elapsed time
  useEffect(() => {
    if (progress?.status === 'processing') {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [progress?.status, startTime]);

  // Animate progress changes
  useEffect(() => {
    if (!progress) {
      setAnimatedProgress(0);
      return;
    }

    const targetProgress = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    
    // Smooth animation to target progress
    const animationDuration = 500;
    const steps = 20;
    const stepDuration = animationDuration / steps;
    const progressDiff = targetProgress - animatedProgress;
    const stepSize = progressDiff / steps;

    let currentStep = 0;
    const animationInterval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedProgress(targetProgress);
        clearInterval(animationInterval);
      } else {
        setAnimatedProgress(prev => prev + stepSize);
      }
    }, stepDuration);

    return () => clearInterval(animationInterval);
  }, [progress?.completed, progress?.total]);

  // Update message and processing stage
  useEffect(() => {
    if (!progress) return;

    setCurrentMessage(progress.message || "");
    
    // Determine processing stage based on message
    const message = progress.message?.toLowerCase() || "";
    if (message.includes('starting') || message.includes('initializing')) {
      setProcessingStage('Starting');
    } else if (message.includes('parsing') || message.includes('extracting')) {
      setProcessingStage('Parsing');
    } else if (message.includes('analyzing') || message.includes('scoring') || message.includes('requirements')) {
      setProcessingStage('Analyzing');
    } else if (message.includes('indexing') || message.includes('vector') || message.includes('creating')) {
      setProcessingStage('Indexing');
    } else if (message.includes('finalizing') || message.includes('completing')) {
      setProcessingStage('Finalizing');
    } else if (progress.status === 'processing') {
      setProcessingStage('Processing');
    }
  }, [progress?.message, progress?.status]);

  // Handle completion and errors
  useEffect(() => {
    if (progress?.status === 'completed' && onComplete) {
      onComplete();
    } else if (progress?.status === 'error' && onError) {
      onError(progress.error || progress.message || 'Processing failed');
    }
  }, [progress?.status, onComplete, onError]);

  if (!progress) {
    return null;
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'pending':
        return 'blue';
      case 'processing':
        return 'yellow';
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getProgressColor = () => {
    if (progress.status === 'error') return 'red';
    if (progress.status === 'completed') return 'green';
    return 'yellow';
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {showDetails && (
              <p className="text-sm text-gray-600">
                {progress.status === 'completed' 
                  ? `Completed ${progress.total} file${progress.total !== 1 ? 's' : ''}`
                  : progress.status === 'error'
                  ? 'Processing failed'
                  : `${progress.completed} of ${progress.total} file${progress.total !== 1 ? 's' : ''} processed`
                }
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(animatedProgress)}%
          </div>
          {progress.status === 'processing' && (
            <div className="text-xs text-gray-500">
              {formatTime(elapsedTime)}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <LinearProgress
        value={animatedProgress}
        max={100}
        color={getProgressColor()}
        showLabel={false}
        className="mb-4"
      />

      {/* Processing Details */}
      {showDetails && (
        <div className="space-y-3">
          {/* Current Stage */}
          {processingStage && progress.status === 'processing' && (
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-gray-700">Stage:</span>
              <span className="text-gray-600">{processingStage}</span>
            </div>
          )}

          {/* Current Message */}
          {currentMessage && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{currentMessage}</span>
            </div>
          )}

          {/* File Progress */}
          {showFileProgress && progress.filename && (
            <div className="flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-700">Current:</span>
              <span className="text-gray-600 truncate">{progress.filename}</span>
            </div>
          )}

          {/* Completion Summary */}
          {progress.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {progress.successful_files !== undefined && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 font-medium">
                        {progress.successful_files} successful
                      </span>
                    </div>
                  )}
                  {progress.failed_files !== undefined && progress.failed_files > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-800 font-medium">
                        {progress.failed_files} failed
                      </span>
                    </div>
                  )}
                </div>
                {progress.processing_time_ms && (
                  <span className="text-green-700 text-xs">
                    Completed in {formatTime(progress.processing_time_ms)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Details */}
          {progress.status === 'error' && progress.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-red-800 text-sm">{progress.error}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SSEProgressBar;
