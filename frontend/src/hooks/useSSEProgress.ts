"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { sseService } from '@/lib/services/sseService';
import type { ProgressUpdate } from '@/lib/services/googleDriveServices';

export interface SSEProgressState {
  isConnected: boolean;
  isConnecting: boolean;
  progress: ProgressUpdate | null;
  error: string | null;
  connectionAttempts: number;
}

export interface UseSSEProgressOptions {
  autoConnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (progress: ProgressUpdate) => void;
  onComplete?: (progress: ProgressUpdate) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useSSEProgress(userId?: string, options: UseSSEProgressOptions = {}) {
  const {
    autoConnect = false,
    maxRetries = 3,
    retryDelay = 2000,
    onProgress,
    onComplete,
    onError,
    onConnectionChange
  } = options;

  const [state, setState] = useState<SSEProgressState>({
    isConnected: false,
    isConnecting: false,
    progress: null,
    error: null,
    connectionAttempts: 0
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onProgress, onComplete, onError, onConnectionChange });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onProgress, onComplete, onError, onConnectionChange };
  }, [onProgress, onComplete, onError, onConnectionChange]);

  // Progress callback handler
  const handleProgress = useCallback((progress: ProgressUpdate) => {
    console.log('📊 SSE Progress received:', progress);
    
    setState(prev => ({ ...prev, progress, error: null }));
    
    // Call external progress callback
    if (callbacksRef.current.onProgress) {
      callbacksRef.current.onProgress(progress);
    }

    // Handle completion
    if (progress.status === 'completed') {
      console.log('✅ SSE Progress completed');
      if (callbacksRef.current.onComplete) {
        callbacksRef.current.onComplete(progress);
      }
    }

    // Handle errors
    if (progress.status === 'error') {
      const errorMessage = progress.message || progress.error || 'Processing failed';
      console.error('❌ SSE Progress error:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage }));
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(errorMessage);
      }
    }
  }, []);

  // Connection status callback handler
  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log('🔗 SSE Connection status changed:', connected);
    
    setState(prev => ({ 
      ...prev, 
      isConnected: connected,
      isConnecting: false,
      connectionAttempts: connected ? 0 : prev.connectionAttempts
    }));

    if (callbacksRef.current.onConnectionChange) {
      callbacksRef.current.onConnectionChange(connected);
    }
  }, []);

  // Error callback handler
  const handleError = useCallback((error: string) => {
    console.error('❌ SSE Error:', error);
    
    setState(prev => ({ 
      ...prev, 
      error,
      isConnecting: false
    }));

    if (callbacksRef.current.onError) {
      callbacksRef.current.onError(error);
    }
  }, []);

  // Connect to SSE
  const connect = useCallback(async (targetUserId?: string) => {
    const userIdToUse = targetUserId || userId;
    
    if (!userIdToUse) {
      const error = 'User ID is required to connect to SSE';
      console.error('❌', error);
      setState(prev => ({ ...prev, error }));
      return false;
    }

    if (state.isConnecting || state.isConnected) {
      console.log('⚠️ SSE already connecting or connected');
      return state.isConnected;
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null,
      connectionAttempts: prev.connectionAttempts + 1
    }));

    try {
      console.log('🔗 Connecting to SSE for user:', userIdToUse);

      // Setup callbacks
      sseService.onProgress(handleProgress);
      sseService.onConnectionChange(handleConnectionChange);
      sseService.onError(handleError);

      // Connect
      await sseService.connect(userIdToUse);
      
      console.log('✅ SSE connected successfully');
      return true;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect to SSE';
      console.error('❌ SSE connection failed:', errorMessage);
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isConnecting: false
      }));

      // Retry logic
      if (state.connectionAttempts < maxRetries) {
        console.log(`🔄 Retrying SSE connection in ${retryDelay}ms (attempt ${state.connectionAttempts + 1}/${maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          connect(userIdToUse);
        }, retryDelay);
      }

      return false;
    }
  }, [userId, state.isConnecting, state.isConnected, state.connectionAttempts, maxRetries, retryDelay, handleProgress, handleConnectionChange, handleError]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from SSE');
    
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Disconnect service
    sseService.disconnect();
    
    // Reset state
    setState({
      isConnected: false,
      isConnecting: false,
      progress: null,
      error: null,
      connectionAttempts: 0
    });
  }, []);

  // Check current progress
  const checkProgress = useCallback(async (targetUserId?: string) => {
    const userIdToUse = targetUserId || userId;
    
    if (!userIdToUse) {
      console.error('❌ User ID is required to check progress');
      return null;
    }

    try {
      console.log('📊 Checking current progress for user:', userIdToUse);
      const progress = await sseService.checkProgress(userIdToUse);
      
      if (progress) {
        setState(prev => ({ ...prev, progress }));
        console.log('✅ Current progress retrieved:', progress);
      } else {
        console.log('ℹ️ No current progress found');
      }
      
      return progress;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to check progress';
      console.error('❌ Failed to check progress:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [userId]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && userId && !state.isConnected && !state.isConnecting) {
      connect();
    }
  }, [autoConnect, userId, state.isConnected, state.isConnecting, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    checkProgress,
    retry: () => connect(),
    reset: () => setState({
      isConnected: false,
      isConnecting: false,
      progress: null,
      error: null,
      connectionAttempts: 0
    })
  };
}

export default useSSEProgress;
