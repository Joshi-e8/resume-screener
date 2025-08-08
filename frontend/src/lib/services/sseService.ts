/**
 * Server-Sent Events (SSE) service for real-time progress updates
 * Replaces WebSocket implementation with more reliable SSE
 */

// Import ProgressUpdate from existing service to maintain compatibility
import type { ProgressUpdate } from './googleDriveServices';

export interface SSEMessage {
  type: 'connected' | 'progress' | 'keepalive' | 'error';
  data?: ProgressUpdate;
  message?: string;
  user_id?: string;
  timestamp?: number;
}

export type ProgressCallback = (progress: ProgressUpdate) => void;
export type ErrorCallback = (error: string) => void;
export type ConnectionCallback = (connected: boolean) => void;

class SSEService {
  private baseURL: string;
  private eventSource: EventSource | null = null;
  private userId: string | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Callbacks
  private progressCallbacks: ProgressCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Connect to SSE stream for progress updates
   */
  async connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
        resolve();
        return;
      }

      this.userId = userId;
      this.isConnecting = true;

      try {
        const sseUrl = `${this.baseURL}/api/v1/sse/progress/stream/${userId}`;
        console.log('🔗 Connecting to SSE:', sseUrl);
        
        this.eventSource = new EventSource(sseUrl);

        this.eventSource.onopen = () => {
          console.log('✅ SSE connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.notifyConnectionCallbacks(true);
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            console.log('📨 SSE message received:', event.data);
            const message: SSEMessage = JSON.parse(event.data);
            console.log('📋 Parsed SSE message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse SSE message:', error);
            console.error('Raw message data:', event.data);
          }
        };

        this.eventSource.onerror = (event) => {
          console.error('❌ SSE connection error:', event);
          this.isConnecting = false;
          this.notifyConnectionCallbacks(false);

          if (this.eventSource?.readyState === EventSource.CLOSED) {
            console.log('🔄 SSE connection closed, attempting reconnect...');
            this.attemptReconnect();
          }

          reject(new Error('SSE connection failed'));
        };

      } catch (error) {
        this.isConnecting = false;
        console.error('❌ Failed to create SSE connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect() {
    console.log('🔌 Disconnecting SSE...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.userId = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.notifyConnectionCallbacks(false);
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.notifyErrorCallbacks('Max reconnection attempts reached');
      return;
    }

    if (!this.userId) {
      console.error('❌ No user ID available for reconnection');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect(this.userId!);
        console.log('✅ SSE reconnected successfully');
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Handle incoming SSE messages
   */
  private handleMessage(message: SSEMessage) {
    switch (message.type) {
      case 'connected':
        console.log('🎉 SSE connection established:', message.message);
        break;

      case 'progress':
        if (message.data) {
          console.log('📊 Progress update received:', message.data);
          this.notifyProgressCallbacks(message.data);
        }
        break;

      case 'keepalive':
        console.log('💓 SSE keepalive received');
        break;

      case 'error':
        console.error('❌ SSE error message:', message.message);
        this.notifyErrorCallbacks(message.message || 'Unknown SSE error');
        break;

      default:
        console.warn('⚠️ Unknown SSE message type:', message.type);
    }
  }

  /**
   * Register progress callback
   */
  onProgress(callback: ProgressCallback) {
    this.progressCallbacks.push(callback);
  }

  /**
   * Unregister progress callback
   */
  offProgress(callback: ProgressCallback) {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  /**
   * Register error callback
   */
  onError(callback: ErrorCallback) {
    this.errorCallbacks.push(callback);
  }

  /**
   * Unregister error callback
   */
  offError(callback: ErrorCallback) {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Clear all callbacks - useful for preventing duplicate registrations
   */
  clearAllCallbacks() {
    console.log('🧹 Clearing all SSE callbacks');
    this.progressCallbacks = [];
    this.errorCallbacks = [];
    this.connectionCallbacks = [];
  }

  /**
   * Get actual connection state
   */
  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.eventSource) {
      return 'disconnected';
    }

    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'connected';
      case EventSource.CLOSED:
      default:
        return 'disconnected';
    }
  }

  /**
   * Register connection status callback
   */
  onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Unregister connection status callback
   */
  offConnectionChange(callback: ConnectionCallback) {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgressCallbacks(progress: ProgressUpdate) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('❌ Error in progress callback:', error);
      }
    });
  }

  /**
   * Notify error callbacks
   */
  private notifyErrorCallbacks(error: string) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('❌ Error in error callback:', error);
      }
    });
  }

  /**
   * Notify connection callbacks
   */
  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('❌ Error in connection callback:', error);
      }
    });
  }

  /**
   * Check current progress status (one-time API call)
   */
  async checkProgress(userId: string): Promise<ProgressUpdate | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/sse/progress/status/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'found' && data.progress) {
        return data.progress;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to check progress status:', error);
      throw error;
    }
  }

  /**
   * Clean up progress data for a user
   */
  async cleanupProgress(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/sse/progress/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('🧹 Progress data cleaned up for user:', userId);
    } catch (error) {
      console.error('❌ Failed to cleanup progress data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sseService = new SSEService();
export default sseService;
