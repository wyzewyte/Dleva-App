/**
 * Custom Hook for WebSocket Order Updates
 * Integrates orderWebSocket with OrderContext for real-time state sync
 */

import { useEffect, useCallback, useRef } from 'react';
import { useOrder } from '../context/OrderContext';
import orderWebSocket from '../services/orderWebSocket';

export const useOrderWebSocket = (options = {}) => {
  const { 
    autoConnect = false,
    autoRefreshNewOrder = true,
    autoRefreshStatusUpdate = true,
    onNewOrder = null,
    onStatusUpdate = null,
    onMessage = null,
    onError = null,
  } = options;

  const order = useOrder();
  const unsubscribersRef = useRef([]);

  /**
   * Handle new order notification
   */
  const handleNewOrder = useCallback(async (data) => {
    console.log('🎉 New order notification received:', data);
    
    // Refresh available orders
    if (autoRefreshNewOrder && order?.actions?.fetchAvailableOrders) {
      try {
        await order.actions.fetchAvailableOrders();
      } catch (error) {
        console.error('Failed to refresh available orders:', error);
      }
    }

    // Call custom handler if provided
    if (onNewOrder) {
      onNewOrder(data);
    }
  }, [order, autoRefreshNewOrder, onNewOrder]);

  /**
   * Handle order status update
   */
  const handleStatusUpdate = useCallback((data) => {
    console.log('📍 Status update notification received:', data);
    
    const { order_id, status, current_step } = data;

    // If order is assigned to rider, fetch active orders to show it immediately
    if (status === 'assigned' && order?.actions?.fetchActiveOrders) {
      try {
        console.log('🎯 Order assigned! Fetching active orders...');
        order.actions.fetchActiveOrders();
      } catch (error) {
        console.error('Failed to refresh active orders:', error);
      }
    }

    // Update in OrderContext if this order is in active list
    if (autoRefreshStatusUpdate && order?.actions?.updateOrderStatus) {
      try {
        // Update context with new status
        order.actions.updateOrderStatus(order_id, status, { current_step });
      } catch (error) {
        console.error('Failed to update order status:', error);
      }
    }

    // If viewing this order, refresh details
    if (order?.selectedOrder?.id === order_id && order?.actions?.fetchOrderDetails) {
      try {
        order.actions.fetchOrderDetails(order_id);
      } catch (error) {
        console.error('Failed to refresh order details:', error);
      }
    }

    // Call custom handler if provided
    if (onStatusUpdate) {
      onStatusUpdate(data);
    }
  }, [order, autoRefreshStatusUpdate, onStatusUpdate]);

  /**
   * Handle customer message
   */
  const handleMessage = useCallback((data) => {
    console.log('💬 Customer message received:', data);
    
    // Call custom handler if provided
    if (onMessage) {
      onMessage(data);
    }
  }, [onMessage]);

  /**
   * Handle WebSocket error
   */
  const handleError = useCallback((error) => {
    console.error('⚠️ WebSocket error:', error);
    
    // Call custom error handler if provided
    if (onError) {
      onError(error);
    }
  }, [onError]);

  /**
   * Setup and cleanup WebSocket listeners
   */
  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await orderWebSocket.connect();
        console.log('✅ WebSocket connected in hook');
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    connectWebSocket();

    // Subscribe to events
    const unsubscribers = [];

    unsubscribers.push(orderWebSocket.onNewOrder(handleNewOrder));
    unsubscribers.push(orderWebSocket.onStatusUpdate(handleStatusUpdate));
    unsubscribers.push(orderWebSocket.onMessage(handleMessage));
    unsubscribers.push(orderWebSocket.on('error', handleError));

    unsubscribersRef.current = unsubscribers;

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [autoConnect, handleNewOrder, handleStatusUpdate, handleMessage, handleError]);

  /**
   * Return control methods
   */
  return {
    // Connection status
    isConnected: orderWebSocket.isConnected(),
    connectionStatus: orderWebSocket.getStatus(),
    
    // Manual control methods
    connect: () => orderWebSocket.connect(),
    disconnect: () => orderWebSocket.disconnect(),
    
    // Event subscription (if custom handling needed)
    subscribe: (event, callback) => orderWebSocket.on(event, callback),
    unsubscribeAll: () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    },
    
    // Send data
    send: (data) => orderWebSocket.send(data),
    
    // View service state
    getSubscriberCount: (event) => orderWebSocket.getSubscriberCount(event),
  };
};

/**
 * Hook to listen for new orders only
 */
export const useNewOrderListener = (callback, enabled = true) => {
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Connect if not already connected
    orderWebSocket.connect().catch(err => {
      console.error('Failed to connect WebSocket:', err);
    });

    // Subscribe
    unsubscribeRef.current = orderWebSocket.onNewOrder(callback);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [callback, enabled]);
};

/**
 * Hook to listen for status updates only
 */
export const useStatusUpdateListener = (callback, enabled = true) => {
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Connect if not already connected
    orderWebSocket.connect().catch(err => {
      console.error('Failed to connect WebSocket:', err);
    });

    // Subscribe
    unsubscribeRef.current = orderWebSocket.onStatusUpdate(callback);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [callback, enabled]);
};

/**
 * Hook to listen for customer messages only
 */
export const useOrderMessageListener = (callback, enabled = true) => {
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Connect if not already connected
    orderWebSocket.connect().catch(err => {
      console.error('Failed to connect WebSocket:', err);
    });

    // Subscribe
    unsubscribeRef.current = orderWebSocket.onMessage(callback);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [callback, enabled]);
};

export default useOrderWebSocket;
