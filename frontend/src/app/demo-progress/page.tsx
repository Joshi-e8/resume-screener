"use client";

import { useState, useEffect } from 'react';
import { SSEProgressBar } from '@/components/ui/SSEProgressBar';
import { LinearProgress } from '@/components/ui/ProgressIndicator';
import { Play, Square, RotateCcw, Zap, CheckCircle, AlertCircle } from 'lucide-react';

export default function DemoProgressPage() {
  const [progress, setProgress] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [demoType, setDemoType] = useState<'single' | 'multiple' | 'zip'>('multiple');

  const demos = {
    single: {
      title: 'Single Resume Processing',
      stages: [
        { completed: 0, message: 'Uploading resume...', delay: 1000 },
        { completed: 0, message: 'Parsing resume content...', filename: 'john_doe_resume.pdf', delay: 2000 },
        { completed: 0, message: 'Analyzing skills and experience...', filename: 'john_doe_resume.pdf', delay: 2500 },
        { completed: 1, message: 'Creating vector embeddings...', filename: 'john_doe_resume.pdf', delay: 2000 },
        { completed: 1, message: 'Processing complete!', delay: 1000, status: 'completed', successful_files: 1, failed_files: 0, processing_time_ms: 8500 }
      ],
      total: 1
    },
    multiple: {
      title: 'Multiple Resume Processing',
      stages: [
        { completed: 0, message: 'Starting batch processing...', delay: 1000 },
        { completed: 1, message: 'Parsing resume 1 of 5...', filename: 'alice_smith.pdf', delay: 2000 },
        { completed: 2, message: 'Analyzing resume 2 of 5 against job requirements...', filename: 'bob_johnson.docx', delay: 2500 },
        { completed: 3, message: 'Creating vector index for resume 3 of 5...', filename: 'carol_williams.pdf', delay: 2000 },
        { completed: 4, message: 'Finalizing resume 4 of 5...', filename: 'david_brown.pdf', delay: 1500 },
        { completed: 5, message: 'All files processed successfully!', filename: 'emma_davis.docx', delay: 1000, status: 'completed', successful_files: 5, failed_files: 0, processing_time_ms: 12500 }
      ],
      total: 5
    },
    zip: {
      title: 'ZIP Archive Processing',
      stages: [
        { completed: 0, message: 'Extracting ZIP archive...', delay: 1500 },
        { completed: 0, message: 'Found 8 resume files in archive...', delay: 1000 },
        { completed: 1, message: 'Processing extracted file 1 of 8...', filename: 'senior_dev_1.pdf', delay: 2000 },
        { completed: 3, message: 'Analyzing extracted file 3 of 8...', filename: 'frontend_dev_2.docx', delay: 2500 },
        { completed: 5, message: 'Creating embeddings for file 5 of 8...', filename: 'fullstack_dev_1.pdf', delay: 2000 },
        { completed: 7, message: 'Finalizing file 7 of 8...', filename: 'backend_dev_3.pdf', delay: 1500 },
        { completed: 8, message: 'ZIP archive processed successfully!', delay: 1000, status: 'completed', successful_files: 8, failed_files: 0, processing_time_ms: 18500 }
      ],
      total: 8
    }
  };

  const startDemo = () => {
    if (isRunning) return;
    
    const demo = demos[demoType];
    setIsRunning(true);
    setProgress({
      completed: 0,
      total: demo.total,
      status: 'processing',
      message: 'Initializing...'
    });

    let currentStage = 0;
    const runNextStage = () => {
      if (currentStage >= demo.stages.length) {
        setIsRunning(false);
        return;
      }

      const stage = demo.stages[currentStage];
      setProgress({
        completed: stage.completed,
        total: demo.total,
        status: stage.status || 'processing',
        message: stage.message,
        filename: stage.filename,
        successful_files: stage.successful_files,
        failed_files: stage.failed_files,
        processing_time_ms: stage.processing_time_ms
      });

      currentStage++;
      if (currentStage < demo.stages.length) {
        setTimeout(runNextStage, stage.delay);
      } else {
        setIsRunning(false);
      }
    };

    setTimeout(runNextStage, 500);
  };

  const stopDemo = () => {
    setIsRunning(false);
    setProgress(null);
  };

  const simulateError = () => {
    const demo = demos[demoType];
    setProgress({
      completed: Math.floor(demo.total / 2),
      total: demo.total,
      status: 'error',
      message: 'Processing failed',
      error: 'Failed to parse resume: Unsupported file format or corrupted file',
      filename: 'corrupted_resume.pdf'
    });
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SSE Progress Bar Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience real-time progress tracking for resume processing with our enhanced SSE progress bar component.
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Interactive Demo</h2>
          
          {/* Demo Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose Demo Type:</label>
            <div className="flex flex-wrap gap-3">
              {Object.entries(demos).map(([key, demo]) => (
                <button
                  key={key}
                  onClick={() => setDemoType(key as any)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    demoType === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {demo.title}
                </button>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startDemo}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Play className="w-5 h-5" />
              Start {demos[demoType].title}
            </button>

            <button
              onClick={stopDemo}
              disabled={!isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Square className="w-5 h-5" />
              Stop Demo
            </button>

            <button
              onClick={() => { setProgress(null); setIsRunning(false); }}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>

            <button
              onClick={simulateError}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Zap className="w-5 h-5" />
              Simulate Error
            </button>
          </div>
        </div>

        {/* Progress Bar Demo */}
        {progress && (
          <div className="mb-8">
            <SSEProgressBar
              progress={progress}
              title={demos[demoType].title}
              showDetails={true}
              showFileProgress={true}
              onComplete={() => {
                console.log('🎉 Demo completed!');
              }}
              onError={(error) => {
                console.error('❌ Demo error:', error);
              }}
            />
          </div>
        )}

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Features */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Features</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Real-time Progress Updates</h4>
                  <p className="text-sm text-gray-600">Live progress tracking via Server-Sent Events</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Processing Stage Detection</h4>
                  <p className="text-sm text-gray-600">Automatic stage identification and visual indicators</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">File-level Details</h4>
                  <p className="text-sm text-gray-600">Shows current file being processed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Error Handling</h4>
                  <p className="text-sm text-gray-600">Comprehensive error display and recovery</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                  <p className="text-sm text-gray-600">Processing time tracking and completion stats</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Demo Statistics</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Single Resume</span>
                  <span className="text-sm text-gray-500">~8.5s avg</span>
                </div>
                <LinearProgress value={85} color="green" showLabel={false} size="sm" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Multiple Resumes</span>
                  <span className="text-sm text-gray-500">~12.5s avg</span>
                </div>
                <LinearProgress value={65} color="blue" showLabel={false} size="sm" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">ZIP Archive</span>
                  <span className="text-sm text-gray-500">~18.5s avg</span>
                </div>
                <LinearProgress value={45} color="yellow" showLabel={false} size="sm" />
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Performance Note</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Processing times vary based on file size, content complexity, and server load.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">How to Use This Demo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Getting Started</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li>Select a demo type (Single, Multiple, or ZIP)</li>
                <li>Click "Start" to begin the simulation</li>
                <li>Watch the progress bar animate through stages</li>
                <li>Try the "Simulate Error" button to see error handling</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">What to Observe</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                <li>Real-time progress percentage updates</li>
                <li>Processing stage indicators and messages</li>
                <li>Current filename being processed</li>
                <li>Completion summary with timing</li>
                <li>Error states and recovery options</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
