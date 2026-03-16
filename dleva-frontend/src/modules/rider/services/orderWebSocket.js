/**
 * Order WebSocket Service
 * Handles real-time order notifications (new orders, status updates, messages)
 * Separate from riderWebSocket which handles individual delivery tracking
 * Singleton pattern with auto-reconnect capability
 */

class OrderWebSocket {
  constructor() {
    this.ws = null;
    this.eventHandlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isIntentionallyClosed = false;
    this.connectionPromise = null;
    this.resolveConnection = null;
  }

  /**
   * Build WebSocket URL for order notifications
   * ⚠️ Backend support: The /ws/rider/orders/ endpoint is NOT yet implemented
   * To enable: Create a RiderOrdersConsumer in rider/consumers.py 
   * For now, use HTTP polling instead (fetchAvailableOrders)
   */
  getWebSocketUrl() {
    let wsUrl;
    
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const baseUrl = apiBase.replace('/api', '');
    
    // Convert to WebSocket protocol
    if (baseUrl.includes('https://')) {
      wsUrl = baseUrl.replace('https://', 'wss://');
    } else if (baseUrl.includes('http://')) {
      wsUrl = baseUrl.replace('http://', 'ws://');
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${protocol}://${window.location.host}`;
    }
    
    return `${wsUrl}/ws/rider/orders/`;
  }

  /**
   * Connect to WebSocket for order updates
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ Already connected to order WebSocket');
      return Promise.resolve();
    }

    // Return existing connection promise if connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isIntentionallyClosed = false;
    
    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      const wsUrl = this.getWebSocketUrl();
      console.log(`🔗 Connecting to order WebSocket: ${wsUrl}`);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Order WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connected', { timestamp: new Date() });
          resolve();
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
          console.warn('Order WebSocket error:', error);
          this.emit('error', { error: error.message });
          // Don't reject - let onclose handle it
        };

        this.ws.onclose = (event) => {
          console.log('❌ Order WebSocket disconnected', event.code);
          this.connectionPromise = null;
          this.emit('disconnected', { timestamp: new Date() });
          
          // ✅ Only reconnect if intentional close and max attempts not reached
          // Skip reconnect for 404s (endpoint doesn't exist)
          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts && event.code !== 1002) {
            this.attemptReconnect();
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('⚠️ Max reconnection attempts reached for Order WebSocket');
          }
        };
      } catch (error) {
        console.warn('⚠️ Failed to create WebSocket (endpoint may not exist):', error.message);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.connect().catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   * Routes to appropriate handlers based on message type
   */
  handleMessage(data) {
    console.log('📡 Order WebSocket message:', data);

    const { type, event, order_id } = data;
    const eventKey = type || event;

    // Emit type-specific event
    if (eventKey) {
      this.emit(eventKey, data);
    }

    // Emit generic 'order' event
    this.emit('order', data);
  }

  /**
   * Subscribe to WebSocket events
   * @param {string} event - Event name (new_order, status_update, order_message, etc.)
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);

    // Return unsubscribe function
    return () => {
      if (this.eventHandlers[event]) {
        this.eventHandlers[event] = this.eventHandlers[event].filter(
          cb => cb !== callback
        );
      }
    };
  }

  /**
   * Subscribe to event once and auto-unsubscribe
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }

  /**
   * Emit event to all subscribers
   */
  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Send message through WebSocket
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('Order WebSocket is not connected');
      return false;
    }
  }

  /**
   * Subscribe to new orders
   */
  onNewOrder(callback) {
    return this.on('new_order', callback);
  }

  /**
   * Subscribe to order status changes
   */
  onStatusUpdate(callback) {
    return this.on('status_update', callback);
  }

  /**
   * Subscribe to customer messages
   */
  onMessage(callback) {
    return this.on('order_message', callback);
  }

  /**
   * Subscribe to order cancellations
   */
  onOrderCancelled(callback) {
    return this.on('order_cancelled', callback);
  }

  /**
   * Subscribe to all order events
   */
  onOrderEvent(callback) {
    return this.on('order', callback);
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
    this.connectionPromise = null;
    this.eventHandlers = {};
    console.log('🔌 Order WebSocket disconnected');
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

  /**
   * Get number of active subscribers
   */
  getSubscriberCount(event = null) {
    if (event) {
      return (this.eventHandlers[event] || []).length;
    }
    return Object.values(this.eventHandlers).reduce((sum, handlers) => sum + handlers.length, 0);
  }

  /**
   * Clear all event handlers
   */
  clearHandlers() {
    this.eventHandlers = {};
  }

  /**
   * Clear handlers for specific event
   */
  clearEvent(event) {
    delete this.eventHandlers[event];
  }
}

// Export singleton instance
export default new OrderWebSocket();
