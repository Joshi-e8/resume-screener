/**
 * WebSocket Service for Real-time Progress Updates
 * Clean, reliable WebSocket implementation
 */

export interface ProgressUpdate {
  completed: number;
  total: number;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
  successful_files?: number;
  failed_files?: number;
  results?: any[];
}

export interface WebSocketMessage {
  type: 'progress' | 'connected' | 'error' | 'keepalive' | 'subscribed';
  data?: ProgressUpdate;
  message?: string;
  user_id?: string;
  timestamp?: number;
}

type ProgressCallback = (progress: ProgressUpdate) => void;
type ConnectionCallback = (connected: boolean) => void;
type ErrorCallback = (error: string) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  // Callbacks
  private progressCallbacks: ProgressCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string): Promise<void> {
    if (this.isConnecting) {
      console.log('🔄 WebSocket connection already in progress');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.isConnecting = true;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:8000/api/v1/websocket/ws/progress/${userId}`;
        console.log('🔗 Connecting to WebSocket:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Send initial subscribe message to keep connection alive
          try {
            this.ws?.send(JSON.stringify({
              type: "subscribe",
              user_id: userId
            }));
            console.log('📡 Sent initial subscribe message');
          } catch (error) {
            console.error('❌ Failed to send initial message:', error);
          }

          this.notifyConnectionChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          console.log('🔍 WebSocket close details:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            timestamp: new Date().toISOString()
          });
          this.isConnecting = false;
          this.notifyConnectionChange(false);

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.notifyError('WebSocket connection error');
          reject(error);
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

      } catch (error) {
        this.isConnecting = false;
        console.error('❌ Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket...');
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.notifyConnectionChange(false);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      console.log('📨 WebSocket message received:', data);
      const message: WebSocketMessage = JSON.parse(data);
      console.log('📋 Parsed WebSocket message:', message);

      switch (message.type) {
        case 'connected':
          console.log('🎉 WebSocket connection confirmed:', message.message);
          break;

        case 'progress':
          if (message.data) {
            console.log('📊 Progress update received:', message.data);
            this.notifyProgress(message.data);
          }
          break;

        case 'keepalive':
          console.log('💓 WebSocket keepalive received');
          break;

        case 'subscribed':
          console.log('✅ WebSocket subscription confirmed:', message.message);
          break;

        case 'error':
          console.error('❌ WebSocket error message:', message.message);
          this.notifyError(message.message || 'Unknown error');
          break;

        default:
          console.warn('⚠️ Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
      this.notifyError('Failed to parse message');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`🔄 Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(async () => {
      if (this.shouldReconnect && this.userId) {
        try {
          await this.connect(this.userId);
        } catch (error) {
          console.error('❌ WebSocket reconnection failed:', error);
        }
      }
    }, delay);
  }

  /**
   * Get connection state
   */
  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Callback management
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  offProgress(callback: ProgressCallback): void {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  offConnectionChange(callback: ConnectionCallback): void {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  offError(callback: ErrorCallback): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  clearAllCallbacks(): void {
    console.log('🧹 Clearing all WebSocket callbacks');
    this.progressCallbacks = [];
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
  }

  // Notification methods
  private notifyProgress(progress: ProgressUpdate): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('❌ Error in progress callback:', error);
      }
    });
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('❌ Error in connection callback:', error);
      }
    });
  }

  private notifyError(error: string): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('❌ Error in error callback:', error);
      }
    });
  }

}

// Export singleton instance
export const websocketService = new WebSocketService();
