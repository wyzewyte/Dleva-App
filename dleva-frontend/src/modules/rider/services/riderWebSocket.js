/**
 * Rider WebSocket Service
 * Handles real-time delivery updates via WebSocket
 * Singleton pattern with auto-reconnect capability
 */

class RiderWebSocket {
  constructor() {
    this.ws = null;
    this.orderId = null;
    this.messageHandlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isIntentionallyClosed = false;
  }

  /**
   * Build WebSocket URL from API base URL
   * Converts http/https to ws/wss
   */
  getWebSocketUrl(orderId) {
    let wsUrl;
    
    // Use VITE API URL or fallback to window location
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    
    // Remove /api suffix from base URL
    const baseUrl = apiBase.replace('/api', '');
    
    // Convert to WebSocket protocol
    if (baseUrl.includes('https://')) {
      wsUrl = baseUrl.replace('https://', 'wss://');
    } else if (baseUrl.includes('http://')) {
      wsUrl = baseUrl.replace('http://', 'ws://');
    } else {
      // Fallback: use window.location
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${protocol}://${window.location.host}`;
    }
    
    return `${wsUrl}/ws/order/status/${orderId}/`;
  }

  /**
   * Connect to WebSocket for order updates
   */
  connect(orderId) {
    if (this.ws && this.orderId === orderId) {
      console.log(`✅ Already connected to order ${orderId}`);
      return;
    }

    this.orderId = orderId;
    this.isIntentionallyClosed = false;

    const wsUrl = this.getWebSocketUrl(orderId);
    console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`✅ WebSocket connected for order ${orderId}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Emit error to listeners
        if (this.messageHandlers['*']) {
          this.messageHandlers['*'].forEach(callback => {
            try {
              callback({ type: 'error', error: error });
            } catch (e) {
              console.error('Error in handler:', e);
            }
          });
        }
      };

      this.ws.onclose = () => {
        console.log(`❌ WebSocket disconnected for order ${orderId}`);
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  /**
   * Connect to rider notifications socket
   */
  connectNotifications(riderId) {
    // Notifications don't need an order id
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const baseUrl = apiBase.replace('/api', '');

    let wsUrl;
    if (baseUrl.includes('https://')) {
      wsUrl = baseUrl.replace('https://', 'wss://');
    } else if (baseUrl.includes('http://')) {
      wsUrl = baseUrl.replace('http://', 'ws://');
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${protocol}://${window.location.host}`;
    }

    const url = `${wsUrl}/ws/rider/notifications/${riderId}/`;
    console.log(`🔔 Connecting to Notifications WebSocket: ${url}`);

    // Reuse connect flow but for notifications
    this.isIntentionallyClosed = false;
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`✅ Notifications WebSocket connected for rider ${riderId}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse Notifications WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Notifications WebSocket error:', error);
        if (this.messageHandlers['*']) {
          this.messageHandlers['*'].forEach(callback => {
            try { callback({ type: 'error', error }); } catch (e) { console.error(e); }
          });
        }
      };

      this.ws.onclose = () => {
        console.log(`❌ Notifications WebSocket disconnected for rider ${riderId}`);
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create Notifications WebSocket:', error);
    }
  }

  /**
   * Attempt to reconnect to WebSocket with exponential backoff
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isIntentionallyClosed && this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.orderId);
      } else if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.warn('⚠️ Max reconnection attempts reached for RiderWebSocket');
      }
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    console.log('📡 WebSocket message:', data);

    // Event-specific handlers
    const { event, type } = data;
    const key = event || type;

    if (key && this.messageHandlers[key]) {
      this.messageHandlers[key].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in handler for ${key}:`, error);
        }
      });
    }

    // Generic message handler
    if (this.messageHandlers['*']) {
      this.messageHandlers['*'].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in generic handler:', error);
        }
      });
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event, callback) {
    if (!this.messageHandlers[event]) {
      this.messageHandlers[event] = [];
    }
    this.messageHandlers[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.messageHandlers[event] = this.messageHandlers[event].filter(
        cb => cb !== callback
      );
    };
  }

  /**
   * Send message through WebSocket
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = {};
    this.orderId = null;
    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus() {
    if (!this.ws) return 'disconnected';
    if (this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    if (this.ws.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws.readyState === WebSocket.CLOSING) return 'closing';
    return 'closed';
  }
}

// Export singleton instance
export default new RiderWebSocket();
