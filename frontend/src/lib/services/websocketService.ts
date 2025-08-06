/**
 * WebSocket service for real-time progress updates
 */

import { ProgressUpdate } from './googleDriveServices';

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  task_id?: string;
}

export type ProgressCallback = (progress: ProgressUpdate) => void;
export type ErrorCallback = (error: string) => void;
export type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private baseURL: string;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50; // Much higher for tab switching scenarios
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private lastPongTime = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Callbacks
  private progressCallbacks: ProgressCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Convert HTTP URL to WebSocket URL
    this.baseURL = this.baseURL.replace('http://', 'ws://').replace('https://', 'wss://');
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.userId = userId;
      this.isConnecting = true;

      try {
        const wsUrl = `${this.baseURL}/api/v1/websocket/ws/progress/${userId}`;
        console.log('Connecting to WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startKeepAlive();
          this.notifyConnectionCallbacks(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            // Update heartbeat on any message received
            this.lastPongTime = Date.now();

            console.log('📨 Raw WebSocket message received:', event.data);
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📋 Parsed WebSocket message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            console.error('Raw message data:', event.data);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopKeepAlive();
          this.notifyConnectionCallbacks(false);

          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.notifyErrorCallbacks('WebSocket connection error');
          reject(error);
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.stopKeepAlive();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.userId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Start keep-alive ping mechanism with enhanced heartbeat
   */
  private startKeepAlive() {
    this.stopKeepAlive(); // Clear any existing interval
    this.lastPongTime = Date.now();

    // Send ping every 20 seconds (more frequent for tab switching)
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('📡 Sending keep-alive ping');
        this.ping();
      }
    }, 20000);

    // Check connection health every 3 seconds (more aggressive)
    this.connectionCheckInterval = setInterval(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        console.log('🔍 WebSocket connection unhealthy, attempting reconnect...');
        if (this.userId && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      }
    }, 3000);

    // Heartbeat monitor - check if we've received pong recently
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastPong = Date.now() - this.lastPongTime;

      // If no pong for 60 seconds, consider connection stale
      if (timeSinceLastPong > 60000) {
        console.log('💔 Heartbeat timeout - no pong received, reconnecting...');
        if (this.userId && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop keep-alive ping mechanism
   */
  private stopKeepAlive() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a message to the server
   */
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    this.send({ type: 'ping' });
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: ProgressCallback) {
    this.progressCallbacks.push(callback);
  }

  /**
   * Subscribe to error messages
   */
  onError(callback: ErrorCallback) {
    this.errorCallbacks.push(callback);
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Unsubscribe from connection status changes
   */
  offConnection(callback: ConnectionCallback) {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove progress callback
   */
  offProgress(callback: ProgressCallback) {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove error callback
   */
  offError(callback: ErrorCallback) {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove connection callback
   */
  offConnectionChange(callback: ConnectionCallback) {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage) {
    console.log('🔄 Handling WebSocket message type:', message.type);

    switch (message.type) {
      case 'progress_update':
        console.log('📊 Processing progress_update message:', message.data);
        if (message.data) {
          console.log('📢 Notifying progress callbacks...');
          this.notifyProgressCallbacks(message.data);
          console.log('✅ Progress callbacks notified');
        } else {
          console.warn('⚠️ progress_update message has no data');
        }
        break;
      
      case 'task_complete':
        if (message.data) {
          // Mark progress as complete
          this.notifyProgressCallbacks({
            ...message.data,
            status: 'completed'
          });
        }
        break;
      
      case 'error':
        if (message.message) {
          this.notifyErrorCallbacks(message.message);
        }
        break;
      
      case 'connection_established':
        console.log('WebSocket connection established:', message.message);
        break;
      
      case 'pong':
        // Handle ping response
        break;
      
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
    
    setTimeout(() => {
      if (this.userId && this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.userId).catch((error) => {
          console.error('Reconnect failed:', error);
          // Exponential backoff
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        });
      }
    }, this.reconnectDelay);
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgressCallbacks(progress: ProgressUpdate) {
    console.log(`📢 Notifying ${this.progressCallbacks.length} progress callbacks with:`, progress);

    this.progressCallbacks.forEach((callback, index) => {
      try {
        console.log(`📞 Calling progress callback ${index + 1}...`);
        callback(progress);
        console.log(`✅ Progress callback ${index + 1} completed successfully`);
      } catch (error) {
        console.error(`❌ Error in progress callback ${index + 1}:`, error);
      }
    });

    console.log('🎯 All progress callbacks completed');
  }

  /**
   * Notify error callbacks
   */
  private notifyErrorCallbacks(error: string) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('Error in error callback:', error);
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
        console.error('Error in connection callback:', error);
      }
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
