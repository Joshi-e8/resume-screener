"use client";

import { useState, useEffect } from 'react';
import { sseService } from '@/lib/services/sseService';
import type { ProgressUpdate } from '@/lib/services/googleDriveServices';

export default function TestSSEPage() {
  const [userId, setUserId] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleConnect = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    try {
      setError('');
      addLog(`Connecting to SSE with user ID: ${userId}`);
      
      // Setup callbacks
      const progressCallback = (progressData: ProgressUpdate) => {
        addLog(`Progress update: ${progressData.completed}/${progressData.total} - ${progressData.status}`);
        setProgress(progressData);
      };

      const connectionCallback = (isConnected: boolean) => {
        addLog(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
        setConnected(isConnected);
      };

      const errorCallback = (errorMsg: string) => {
        addLog(`Error: ${errorMsg}`);
        setError(errorMsg);
      };

      sseService.onProgress(progressCallback);
      sseService.onConnectionChange(connectionCallback);
      sseService.onError(errorCallback);

      await sseService.connect(userId);
      addLog('SSE connection established');

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect';
      setError(errorMsg);
      addLog(`Connection failed: ${errorMsg}`);
    }
  };

  const handleDisconnect = () => {
    addLog('Disconnecting from SSE...');
    sseService.disconnect();
    setConnected(false);
    setProgress(null);
  };

  const handleCheckProgress = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    try {
      setError('');
      addLog(`Checking progress for user: ${userId}`);
      const currentProgress = await sseService.checkProgress(userId);
      
      if (currentProgress) {
        addLog(`Found progress: ${currentProgress.completed}/${currentProgress.total}`);
        setProgress(currentProgress);
      } else {
        addLog('No progress found for this user');
        setProgress(null);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to check progress';
      setError(errorMsg);
      addLog(`Check progress failed: ${errorMsg}`);
    }
  };

  const handleCleanup = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    try {
      setError('');
      addLog(`Cleaning up progress for user: ${userId}`);
      await sseService.cleanupProgress(userId);
      addLog('Progress data cleaned up successfully');
      setProgress(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to cleanup progress';
      setError(errorMsg);
      addLog(`Cleanup failed: ${errorMsg}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    // Generate a default user ID
    setUserId(`test_user_${Date.now()}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">SSE Test Page</h1>
        
        {/* Connection Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Controls</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={handleConnect}
              disabled={connected}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Connect
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={!connected}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400"
            >
              Disconnect
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCheckProgress}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Check Progress
            </button>
            
            <button
              onClick={handleCleanup}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Cleanup Progress
            </button>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-4">
            <div className={`flex items-center gap-2 ${connected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            {error && (
              <div className="text-red-600 bg-red-50 px-3 py-1 rounded">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Progress Display */}
        {progress && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Progress</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-semibold ${
                  progress.status === 'completed' ? 'text-green-600' :
                  progress.status === 'failed' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {progress.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Progress:</span>
                <span>{progress.completed}/{progress.total}</span>
              </div>
              
              {(progress as any).message && (
                <div className="flex justify-between">
                  <span>Message:</span>
                  <span className="text-gray-600">{(progress as any).message}</span>
                </div>
              )}
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                {Math.round((progress.completed / progress.total) * 100)}%
              </div>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Logs</h2>
            <button
              onClick={clearLogs}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
