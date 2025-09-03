"use client";

import { useState } from 'react';
import { SSEProgressBar } from '@/components/ui/SSEProgressBar';
import { Play, Square, RotateCcw, Zap } from 'lucide-react';

export default function TestProgressSimplePage() {
  const [progress, setProgress] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startSimulation = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress({
      completed: 0,
      total: 5,
      status: 'processing',
      message: 'Starting simulation...'
    });

    const stages = [
      { completed: 0, message: 'Initializing...', delay: 1000 },
      { completed: 1, message: 'Parsing resume 1 of 5...', filename: 'resume_1.pdf', delay: 2000 },
      { completed: 2, message: 'Analyzing resume 2 of 5...', filename: 'resume_2.pdf', delay: 2500 },
      { completed: 3, message: 'Creating vector index for resume 3 of 5...', filename: 'resume_3.pdf', delay: 2000 },
      { completed: 4, message: 'Finalizing resume 4 of 5...', filename: 'resume_4.pdf', delay: 1500 },
      { completed: 5, message: 'All files processed successfully!', delay: 1000, status: 'completed', successful_files: 5, failed_files: 0, processing_time_ms: 12500 }
    ];

    let currentStage = 0;
    const runNextStage = () => {
      if (currentStage >= stages.length) {
        setIsRunning(false);
        return;
      }

      const stage = stages[currentStage];
      setProgress({
        completed: stage.completed,
        total: 5,
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
        setIsRunning(false);
      }
    };

    setTimeout(runNextStage, 500);
  };

  const stopSimulation = () => {
    setIsRunning(false);
    setProgress(null);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setProgress(null);
  };

  const simulateError = () => {
    setProgress({
      completed: 2,
      total: 5,
      status: 'error',
      message: 'Processing failed',
      error: 'Failed to parse resume_3.pdf: Unsupported file format',
      filename: 'resume_3.pdf'
    });
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Simple Progress Bar Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the SSE progress bar component with simulated data (no authentication required).
          </p>

          {/* Controls */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={startSimulation}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Start Simulation
            </button>

            <button
              onClick={stopSimulation}
              disabled={!isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>

            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            <button
              onClick={simulateError}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              Simulate Error
            </button>
          </div>
        </div>

        {/* Progress Bar Demo */}
        {progress && (
          <SSEProgressBar
            progress={progress}
            title="Resume Processing Simulation"
            showDetails={true}
            showFileProgress={true}
            onComplete={() => {
              console.log('🎉 Simulation completed!');
            }}
            onError={(error) => {
              console.error('❌ Simulation error:', error);
            }}
          />
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Click "Start Simulation" to see the progress bar in action</li>
            <li>Use "Simulate Error" to test error handling and display</li>
            <li>Watch the progress bar animate through different stages</li>
            <li>Check the browser console for debug logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
