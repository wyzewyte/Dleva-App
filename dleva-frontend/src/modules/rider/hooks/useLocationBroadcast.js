/**
 * useLocationBroadcast Hook
 * Manages live location broadcasting to customers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import riderLocationService from '../services/riderLocationService';
import riderWebSocket from '../services/riderWebSocket';

export const useLocationBroadcast = (orderId, enabled = true) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const locationTimeoutRef = useRef(null);

  /**
   * Send location to customer via WebSocket
   */
  const broadcastLocation = useCallback((latitude, longitude, accuracy) => {
    if (!orderId) return;

    try {
      riderWebSocket.send({
        type: 'location.update',
        order_id: orderId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to broadcast location:', err);
    }
  }, [orderId]);

  /**
   * Start location broadcast
   */
  const startBroadcast = useCallback(async () => {
    if (!enabled || !orderId) return;

    try {
      setIsTracking(true);
      setError(null);

      riderLocationService.startTracking(
        (location) => {
          setCurrentLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          setAccuracy(Math.round(location.accuracy));

          // Broadcast location to customer
          broadcastLocation(
            location.latitude,
            location.longitude,
            location.accuracy
          );
        },
        (err) => {
          console.error('Location tracking error:', err);
          setError('Unable to access location');
        }
      );
    } catch (err) {
      console.error('Failed to start broadcast:', err);
      setError('Failed to start location broadcast');
      setIsTracking(false);
    }
  }, [enabled, orderId, broadcastLocation]);

  /**
   * Stop location broadcast
   */
  const stopBroadcast = useCallback(() => {
    riderLocationService.stopTracking();
    setIsTracking(false);
    setCurrentLocation(null);
    setAccuracy(null);
    
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
  }, []);

  /**
   * Manually broadcast current location
   */
  const broadcastCurrentLocation = useCallback(async () => {
    if (!currentLocation) return;

    try {
      broadcastLocation(
        currentLocation.latitude,
        currentLocation.longitude,
        accuracy
      );
      return true;
    } catch (err) {
      console.error('Failed to broadcast current location:', err);
      return false;
    }
  }, [currentLocation, accuracy, broadcastLocation]);

  // Auto-start broadcast if enabled
  useEffect(() => {
    if (enabled && orderId) {
      startBroadcast();
    }

    return () => {
      stopBroadcast();
    };
  }, [enabled, orderId, startBroadcast, stopBroadcast]);

  return {
    isTracking,
    currentLocation,
    accuracy,
    error,
    startBroadcast,
    stopBroadcast,
    broadcastCurrentLocation,
  };
};

export default useLocationBroadcast;