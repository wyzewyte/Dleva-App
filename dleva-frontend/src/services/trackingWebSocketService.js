/**
 * Phase 4: WebSocket Client Service
 * Handles real-time tracking connections for order status and rider location updates
 */

import { logError } from '../utils/errorHandler';

class TrackingWebSocketService {
  constructor() {
    this.connections = {}; // Map of orderId -> WebSocket connection
    this.listeners = {}; // Map of orderId -> callback functions
    this.reconnectAttempts = {}; // Track reconnection attempts
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
  }

  /**
   * Get WebSocket URL based on environment
   */
  getWebSocketUrl(endpoint) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Remove /api from path if present
    const baseUrl = `${protocol}//${host}`;
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Connect to order status updates
   * @param {number} orderId - Order ID to track
   * @param {function} onUpdate - Callback for updates (location, status, ETA)
   * @param {function} onError - Callback for errors
   */
  connectToOrder(orderId, onUpdate, onError) {
    const wsUrl = this.getWebSocketUrl(`/ws/order/status/${orderId}/`);
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`✅ Connected to order ${orderId} tracking`);
        this.reconnectAttempts[orderId] = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📍 Order ${orderId} update:`, data);
          
          // Call the callback with update data
          if (onUpdate) {
            onUpdate(data);
          }
        } catch (err) {
          logError(err, { context: 'WebSocket.onmessage.parse' });
        }
      };
      
      ws.onerror = (error) => {
        console.error(`❌ WebSocket error for order ${orderId}:`, error);
        if (onError) {
          onError(error);
        }
      };
      
      ws.onclose = () => {
        console.log(`⏹️ Disconnected from order ${orderId} tracking`);
        delete this.connections[orderId];
        
        // Attempt reconnection
        this.attemptReconnect(orderId, onUpdate, onError);
      };
      
      // Store connection
      this.connections[orderId] = ws;
      
    } catch (error) {
      logError(error, { context: 'TrackingWebSocketService.connectToOrder' });
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Attempt to reconnect after disconnection
   */
  attemptReconnect(orderId, onUpdate, onError) {
    const attempts = this.reconnectAttempts[orderId] || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts[orderId] = attempts + 1;
      
      setTimeout(() => {
        console.log(`🔄 Attempting to reconnect to order ${orderId} (attempt ${attempts + 1})`);
        this.connectToOrder(orderId, onUpdate, onError);
      }, this.reconnectDelay * (attempts + 1)); // Exponential backoff
    } else {
      console.error(`❌ Max reconnection attempts reached for order ${orderId}`);
      if (onError) {
        onError(new Error('Connection lost - max reconnect attempts exceeded'));
      }
    }
  }

  /**
   * Disconnect from order tracking
   */
  disconnect(orderId) {
    const ws = this.connections[orderId];
    
    if (ws) {
      console.log(`Disconnecting from order ${orderId}`);
      ws.close();
      delete this.connections[orderId];
      delete this.listeners[orderId];
    }
  }

  /**
   * Disconnect all connections
   */
  disconnectAll() {
    Object.keys(this.connections).forEach(orderId => {
      this.disconnect(orderId);
    });
  }

  /**
   * Check connection status
   */
  isConnected(orderId) {
    const ws = this.connections[orderId];
    return ws && ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const trackingWebSocketService = new TrackingWebSocketService();
