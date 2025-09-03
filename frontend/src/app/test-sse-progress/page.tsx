"use client";

import { useState, useEffect } from 'react';
import { SSEProgressBar } from '@/components/ui/SSEProgressBar';
import { useSSEProgress } from '@/hooks/useSSEProgress';
import { Play, Square, RotateCcw, Zap } from 'lucide-react';

export default function TestSSEProgressPage() {
  const [userId, setUserId] = useState<string>('test-user-123');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<any>(null);

  // SSE Progress Hook
  const sseProgress = useSSEProgress(userId, {
    onProgress: (progress) => {
      console.log('📊 Test SSE Progress:', progress);
    },
    onComplete: (progress) => {
      console.log('✅ Test SSE Complete:', progress);
      setSimulationRunning(false);
    },
    onError: (error) => {
      console.error('❌ Test SSE Error:', error);
      setSimulationRunning(false);
    },
    onConnectionChange: (connected) => {
      console.log('🔗 Test SSE Connection:', connected);
    }
  });

  // Simulate progress updates
  const startSimulation = () => {
    if (simulationRunning) return;
    
    setSimulationRunning(true);
    setSimulationProgress({
      completed: 0,
      total: 5,
      status: 'processing',
      message: 'Starting simulation...'
    });

    const stages = [
      { completed: 0, message: 'Initializing...', delay: 1000 },
      { completed: 1, message: 'Parsing resume 1 of 5...', delay: 2000 },
      { completed: 2, message: 'Analyzing resume 2 of 5 against job requirements...', delay: 2500 },
      { completed: 3, message: 'Creating vector index for resume 3 of 5...', delay: 2000 },
      { completed: 4, message: 'Finalizing resume 4 of 5...', delay: 1500 },
      { completed: 5, message: 'All files processed successfully!', delay: 1000, status: 'completed' }
    ];

    let currentStage = 0;
    const runNextStage = () => {
      if (currentStage >= stages.length) {
        setSimulationRunning(false);
        return;
      }

      const stage = stages[currentStage];
      setSimulationProgress({
        completed: stage.completed,
        total: 5,
        status: stage.status || 'processing',
        message: stage.message,
        filename: stage.completed > 0 ? `resume_${stage.completed}.pdf` : undefined,
        successful_files: stage.status === 'completed' ? 5 : undefined,
        failed_files: stage.status === 'completed' ? 0 : undefined,
        processing_time_ms: stage.status === 'completed' ? 12500 : undefined
      });

      currentStage++;
      if (currentStage < stages.length) {
        setTimeout(runNextStage, stage.delay);
      } else {
        setSimulationRunning(false);
      }
    };

    setTimeout(runNextStage, 500);
  };

  const stopSimulation = () => {
    setSimulationRunning(false);
    setSimulationProgress(null);
  };

  const resetSimulation = () => {
    setSimulationRunning(false);
    setSimulationProgress(null);
    sseProgress.reset();
  };

  const simulateError = () => {
    setSimulationProgress({
      completed: 2,
      total: 5,
      status: 'error',
      message: 'Processing failed',
      error: 'Failed to parse resume_3.pdf: Unsupported file format',
      filename: 'resume_3.pdf'
    });
    setSimulationRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SSE Progress Bar Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the real-time Server-Sent Events progress bar component with simulated data.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">User ID:</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                disabled={simulationRunning}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={startSimulation}
                disabled={simulationRunning}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Start Simulation
              </button>

              <button
                onClick={stopSimulation}
                disabled={!simulationRunning}
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
                disabled={simulationRunning}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Simulate Error
              </button>
            </div>
          </div>

          {/* SSE Connection Status */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">SSE Connection Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Connected:</span>
                <span className={`ml-2 font-medium ${sseProgress.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {sseProgress.isConnected ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Connecting:</span>
                <span className={`ml-2 font-medium ${sseProgress.isConnecting ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {sseProgress.isConnecting ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Attempts:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {sseProgress.connectionAttempts}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Error:</span>
                <span className={`ml-2 font-medium ${sseProgress.error ? 'text-red-600' : 'text-green-600'}`}>
                  {sseProgress.error ? 'Yes' : 'None'}
                </span>
              </div>
            </div>
            {sseProgress.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {sseProgress.error}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Demo */}
        {simulationProgress && (
          <SSEProgressBar
            progress={simulationProgress}
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

        {/* Real SSE Progress (if connected) */}
        {sseProgress.progress && (
          <div className="mt-8">
            <SSEProgressBar
              progress={{
                completed: sseProgress.progress.completed || 0,
                total: sseProgress.progress.total || 1,
                status: sseProgress.progress.status || 'processing',
                message: sseProgress.progress.message,
                filename: sseProgress.progress.filename,
                error: sseProgress.progress.error,
                successful_files: sseProgress.progress.successful_files,
                failed_files: sseProgress.progress.failed_files,
                processing_time_ms: sseProgress.progress.processing_time_ms
              }}
              title="Real SSE Progress"
              showDetails={true}
              showFileProgress={true}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Click "Start Simulation" to see the progress bar in action with mock data</li>
            <li>Use "Simulate Error" to test error handling and display</li>
            <li>The SSE connection status shows the real connection state</li>
            <li>If connected to a real SSE stream, progress will appear in the "Real SSE Progress" section</li>
            <li>Use the browser's developer tools to see console logs for debugging</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
