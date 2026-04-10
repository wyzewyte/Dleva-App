/**
 * Phase 4: Real-Time Tracking Context
 * Manages WebSocket connections and broadcasts real-time updates to components
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { trackingWebSocketService } from '../services/trackingWebSocketService';

const TrackingContext = createContext();

export const TrackingProvider = ({ children }) => {
  const [trackedOrders, setTrackedOrders] = useState({}); // Map of orderId -> order data with live updates
  const [connectionStatus, setConnectionStatus] = useState({}); // Map of orderId -> connected/error/disconnected
  const [riderLocations, setRiderLocations] = useState({}); // Map of orderId -> { lat, lon, accuracy, timestamp, eta }

  const upsertTrackedOrder = useCallback((orderId, orderData = {}) => {
    setTrackedOrders((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        ...orderData,
        isLive: prev[orderId]?.isLive || false,
      },
    }));

    setConnectionStatus((prev) => ({
      ...prev,
      [orderId]: prev[orderId] || 'idle',
    }));
  }, []);

  /**
   * Subscribe to real-time order tracking
   */
  const subscribeToOrder = useCallback((orderId, initialOrderData = {}) => {
    console.log(`📡 Subscribing to order ${orderId} tracking`);
    
    upsertTrackedOrder(orderId, initialOrderData);

    setConnectionStatus(prev => ({
      ...prev,
      [orderId]: 'connecting',
    }));

    /**
     * Handle incoming WebSocket messages
     */
    const handleUpdate = (data) => {
      // Mark as live once connected
      setConnectionStatus(prev => ({
        ...prev,
        [orderId]: 'connected',
      }));

      // Handle location updates
      if (data.type === 'location_update') {
        console.log(`📍 Location update for order ${orderId}:`, {
          latitude: data.latitude,
          longitude: data.longitude,
          eta: data.eta_seconds,
        });

        // Update rider location
        setRiderLocations(prev => ({
          ...prev,
          [orderId]: {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            timestamp: new Date(data.timestamp),
            etaSeconds: data.eta_seconds,
            riderId: data.rider_id,
          },
        }));

        // Update tracked order with live data
        setTrackedOrders(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            isLive: true,
            lastUpdate: new Date(data.timestamp),
            riderLocation: {
              latitude: data.latitude,
              longitude: data.longitude,
            },
            eta: data.eta_seconds,
          },
        }));
      }

      // Handle status updates
      if (data.type === 'status_update') {
        console.log(`🔄 Status update for order ${orderId}: ${data.status}`);

        setTrackedOrders(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            isLive: true,
            status: data.status,
            statusLabel: data.message || data.status,
            lastUpdate: new Date(data.timestamp),
          },
        }));
      }
    };

    /**
     * Handle connection errors
     */
    const handleError = (error) => {
      console.error(`❌ Error connecting to order ${orderId}:`, error);
      setConnectionStatus(prev => ({
        ...prev,
        [orderId]: 'error',
      }));
    };

    // Establish WebSocket connection
    trackingWebSocketService.connectToOrder(orderId, handleUpdate, handleError);

    // Return unsubscribe function
    return () => {
      console.log(`📴 Unsubscribing from order ${orderId} tracking`);
      trackingWebSocketService.disconnect(orderId);
      
      setTrackedOrders(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      
      setConnectionStatus(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      
      setRiderLocations(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    };
  }, [upsertTrackedOrder]);

  /**
   * Get order tracking data with live updates
   */
  const getOrderData = useCallback((orderId) => {
    return {
      order: trackedOrders[orderId],
      riderLocation: riderLocations[orderId],
      connectionStatus: connectionStatus[orderId],
    };
  }, [trackedOrders, riderLocations, connectionStatus]);

  /**
   * Clean up all subscriptions on unmount
   */
  useEffect(() => {
    return () => {
      trackingWebSocketService.disconnectAll();
    };
  }, []);

  const value = {
    // State
    trackedOrders,
    riderLocations,
    connectionStatus,

    // Methods
    subscribeToOrder,
    getOrderData,
    upsertTrackedOrder,
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
};

/**
 * Hook to use real-time tracking
 */
export const useTracking = () => {
  const context = useContext(TrackingContext);
  
  if (!context) {
    throw new Error('useTracking must be used within TrackingProvider');
  }
  
  return context;
};
