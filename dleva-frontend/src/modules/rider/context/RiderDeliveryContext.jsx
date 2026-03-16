/**
 * RiderDeliveryContext
 * Manages active delivery state and operations
 */

import React, { createContext, useContext, useState } from 'react';
import riderTracking from '../services/riderTracking';
import riderWebSocket from '../services/riderWebSocket';
import MESSAGES from '../../../constants/messages';

const RiderDeliveryContext = createContext();

export const RiderDeliveryProvider = ({ children }) => {
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [eta, setEta] = useState(null);

  /**
   * Load delivery details
   */
  const loadDelivery = async (orderId) => {
    try {
      setLoading(true);
      const delivery = await riderTracking.getDeliveryDetails(orderId);
      setActiveDelivery(delivery);
      setError(null);

      // Connect WebSocket
      riderWebSocket.connect(orderId);

      // Listen to updates
      riderWebSocket.on('delivery.status_changed', data => {
        setActiveDelivery(prev => ({ ...prev, status: data.status }));
      });

      riderWebSocket.on('delivery.location_updated', data => {
        setRiderLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
        });
      });

      riderWebSocket.on('delivery.eta_updated', data => {
        if (data.eta_seconds) {
          setEta(data.eta_seconds);
        }
      });

      return delivery;
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update rider location
   */
  const updateLocation = async (latitude, longitude, accuracy) => {
    try {
      await riderTracking.updateLocation(
        activeDelivery.id,
        latitude,
        longitude,
        accuracy
      );
      setRiderLocation({ latitude, longitude, accuracy });
    } catch (err) {
      console.error('Location update failed:', err);
    }
  };

  /**
   * Mark arrived at pickup
   */
  const arrivedAtPickup = async () => {
    try {
      setLoading(true);
      const result = await riderTracking.arrivedAtPickup(activeDelivery.id);
      setActiveDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirm pickup
   */
  const confirmPickup = async (itemsVerified) => {
    try {
      setLoading(true);
      const result = await riderTracking.confirmPickup(activeDelivery.id, itemsVerified);
      setActiveDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark on the way
   */
  const markOnTheWay = async () => {
    try {
      setLoading(true);
      const result = await riderTracking.markOnTheWay(activeDelivery.id);
      setActiveDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Record delivery attempt
   * @param {string} reason - Reason for failed delivery attempt
   */
  const attemptDelivery = async (reason) => {
    try {
      setLoading(true);
      const result = await riderTracking.attemptDelivery(activeDelivery.id, reason);
      setActiveDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete delivery with customer PIN
   * @param {string} deliveryPin - PIN provided by customer
   * @param {File} proofPhoto - Optional proof photo
   * @param {string} notes - Optional delivery notes
   */
  const completeDelivery = async (deliveryPin, proofPhoto, notes) => {
    try {
      setLoading(true);
      const result = await riderTracking.completeDelivery(
        activeDelivery.id,
        deliveryPin,
        proofPhoto,
        notes
      );
      setActiveDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel delivery
   */
  const cancelDelivery = async (reason) => {
    try {
      setLoading(true);
      const result = await riderTracking.cancelDelivery(activeDelivery.id, reason);
      setActiveDelivery(prev => ({ ...prev, status: result.status }));
      return result;
    } catch (err) {
      setError(err.error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear active delivery
   */
  const clearDelivery = () => {
    riderWebSocket.disconnect();
    setActiveDelivery(null);
    setRiderLocation(null);
    setEta(null);
    setError(null);
  };

  const value = {
    activeDelivery,
    loading,
    error,
    riderLocation,
    eta,
    actions: {
      loadDelivery,
      updateLocation,
      arrivedAtPickup,
      confirmPickup,
      markOnTheWay,
      attemptDelivery,
      completeDelivery,
      cancelDelivery,
      clearDelivery,
    },
  };

  return (
    <RiderDeliveryContext.Provider value={value}>
      {children}
    </RiderDeliveryContext.Provider>
  );
};

export const useRiderDelivery = () => {
  const context = useContext(RiderDeliveryContext);
  if (!context) {
    throw new Error('useRiderDelivery must be used within RiderDeliveryProvider');
  }
  return context;
};
