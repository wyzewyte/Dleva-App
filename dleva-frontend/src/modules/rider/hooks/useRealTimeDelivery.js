/**
 * useRealTimeDelivery Hook
 * Manages real-time delivery tracking and updates
 */

import { useState, useEffect, useCallback } from 'react';
import riderTracking from '../services/riderTracking';
import riderWebSocket from '../services/riderWebSocket';

export const useRealTimeDelivery = (orderId) => {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [eta, setEta] = useState(null);

  /**
   * Fetch initial delivery details
   */
  const fetchDelivery = useCallback(async () => {
    try {
      setLoading(true);
      const data = await riderTracking.getDeliveryDetails(orderId);
      setDelivery(data);
      setError(null);
    } catch (err) {
      setError(err.error || 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Update rider location via GPS
   */
  const updateLocation = useCallback(async (latitude, longitude, accuracy) => {
    try {
      await riderTracking.updateLocation(orderId, latitude, longitude, accuracy);
      setRiderLocation({ latitude, longitude, accuracy });
    } catch (err) {
      console.error('Location update failed:', err);
    }
  }, [orderId]);

  /**
   * Arrive at pickup location
   */
  const arrivedAtPickup = useCallback(async () => {
    try {
      const result = await riderTracking.arrivedAtPickup(orderId);
      setDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error || 'Failed to confirm arrival');
      throw err;
    }
  }, [orderId]);

  /**
   * Confirm pickup
   */
  const confirmPickup = useCallback(async (itemsVerified = true) => {
    try {
      const result = await riderTracking.confirmPickup(orderId, itemsVerified);
      setDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error || 'Failed to confirm pickup');
      throw err;
    }
  }, [orderId]);

  /**
   * Mark as on the way
   */
  const markOnTheWay = useCallback(async () => {
    try {
      const result = await riderTracking.markOnTheWay(orderId);
      setDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error || 'Failed to update status');
      throw err;
    }
  }, [orderId]);

  /**
   * Record delivery attempt
   */
  const attemptDelivery = useCallback(async (notes) => {
    try {
      const result = await riderTracking.attemptDelivery(orderId, notes);
      setDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error || 'Failed to record attempt');
      throw err;
    }
  }, [orderId]);

  /**
   * Complete delivery with proof
   */
  const completeDelivery = useCallback(async (proofPhoto, notes) => {
    try {
      const result = await riderTracking.completeDelivery(orderId, proofPhoto, notes);
      setDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error || 'Failed to complete delivery');
      throw err;
    }
  }, [orderId]);

  /**
   * Cancel delivery
   */
  const cancelDelivery = useCallback(async (reason) => {
    try {
      const result = await riderTracking.cancelDelivery(orderId, reason);
      setDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error || 'Failed to cancel delivery');
      throw err;
    }
  }, [orderId]);

  /**
   * Start GPS tracking
   */
  const startGPSTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        updateLocation(latitude, longitude, accuracy);
      },
      error => {
        console.error('GPS error:', error);
        setError(`GPS Error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return watchId;
  }, [updateLocation]);

  /**
   * Stop GPS tracking
   */
  const stopGPSTracking = useCallback((watchId) => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  /**
   * Setup WebSocket connection and listeners
   */
  useEffect(() => {
    if (!orderId) return;

    // Fetch initial delivery details
    fetchDelivery();

    // Connect to WebSocket
    riderWebSocket.connect(orderId);

    // Listen for status updates
    const unsubscribeStatus = riderWebSocket.on('status_update', (data) => {
      if (data.status) {
        setDelivery(prev => ({ ...prev, status: data.status }));
      }
    });

    // Listen for location updates
    const unsubscribeLocation = riderWebSocket.on('location_update', (data) => {
      if (data.latitude && data.longitude) {
        setRiderLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
        });
      }
    });

    // Listen for ETA updates
    const unsubscribeETA = riderWebSocket.on('delivery.eta_updated', (data) => {
      if (data.eta_seconds !== undefined) {
        setEta(data.eta_seconds);
      }
    });

    // Listen for generic message updates
    const unsubscribeGeneric = riderWebSocket.on('*', (data) => {
      if (data.delivery) {
        setDelivery(prev => ({ ...prev, ...data.delivery }));
      }
    });

    // Cleanup
    return () => {
      unsubscribeStatus();
      unsubscribeLocation();
      unsubscribeETA();
      unsubscribeGeneric();
    };
  }, [orderId, fetchDelivery]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      riderWebSocket.disconnect();
    };
  }, []);

  return {
    delivery,
    loading,
    error,
    riderLocation,
    eta,
    actions: {
      fetchDelivery,
      updateLocation,
      arrivedAtPickup,
      confirmPickup,
      markOnTheWay,
      attemptDelivery,
      completeDelivery,
      cancelDelivery,
      startGPSTracking,
      stopGPSTracking,
    },
  };
};
