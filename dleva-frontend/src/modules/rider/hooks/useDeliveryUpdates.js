/**
 * useDeliveryUpdates Hook
 * Manages real-time delivery status updates via WebSocket
 */

import { useState, useEffect, useCallback } from 'react';
import riderWebSocket from '../services/riderWebSocket';
import { playNotificationSound, vibrate } from '../utils/realtimeUtils';

export const useDeliveryUpdates = (orderId) => {
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Handle delivery status change
   */
  const handleStatusChange = useCallback((data) => {
    console.log('📦 Delivery status changed:', data);
    
    setDeliveryStatus(data.status);
    setLastUpdate(new Date());
    
    // Add to history
    setStatusHistory(prev => [...prev, {
      status: data.status,
      timestamp: new Date(),
      details: data.details || {}
    }]);
  }, []);

  /**
   * Handle delivery assigned
   */
  const handleDeliveryAssigned = useCallback((data) => {
    console.log('🎯 Delivery assigned:', data);
    playNotificationSound();
    vibrate([100, 50, 100]);
  }, []);

  /**
   * Handle delivery cancelled
   */
  const handleDeliveryCancelled = useCallback((data) => {
    console.log('❌ Delivery cancelled:', data);
    setDeliveryStatus('cancelled');
    setLastUpdate(new Date());
  }, []);

  /**
   * Connect to WebSocket for delivery updates
   */
  useEffect(() => {
    if (!orderId) return;

    riderWebSocket.connect(orderId);
    setIsConnected(riderWebSocket.isConnected());

    // Subscribe to delivery events
    const unsubscribeStatus = riderWebSocket.on('delivery.status_changed', handleStatusChange);
    const unsubscribeAssigned = riderWebSocket.on('delivery.assigned', handleDeliveryAssigned);
    const unsubscribeCancelled = riderWebSocket.on('delivery.cancelled', handleDeliveryCancelled);

    return () => {
      unsubscribeStatus();
      unsubscribeAssigned();
      unsubscribeCancelled();
    };
  }, [orderId, handleStatusChange, handleDeliveryAssigned, handleDeliveryCancelled]);

  /**
   * Check connection status
   */
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setIsConnected(riderWebSocket.isConnected());
    }, 2000);

    return () => clearInterval(checkConnection);
  }, []);

  /**
   * Get current status
   */
  const getStatus = useCallback(() => {
    return deliveryStatus;
  }, [deliveryStatus]);

  /**
   * Get connection status
   */
  const getConnectionStatus = useCallback(() => {
    return riderWebSocket.getStatus();
  }, []);

  return {
    deliveryStatus,
    statusHistory,
    isConnected,
    lastUpdate,
    getStatus,
    getConnectionStatus,
  };
};

export default useDeliveryUpdates;