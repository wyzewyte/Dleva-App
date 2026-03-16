/**
 * useOfflineDeliveryActions Hook
 * Handles offline queuing for delivery lifecycle actions
 */

import { useCallback, useState } from 'react';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import api from '../../../services/axios';
import offlineSyncService from '../services/offlineSyncService';
import offlineStorage from '../utils/offlineStorage';

export const useOfflineDeliveryActions = (orderId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute action (online or queue if offline)
   */
  const executeAction = useCallback(
    async (actionName, endpoint, data = null) => {
      setIsLoading(true);
      setError(null);

      try {
        if (offlineSyncService.isOnline()) {
          // Online - execute immediately
          console.log(`📤 Executing action: ${actionName}`);
          
          const response = await api.post(endpoint, data);
          
          // Cache the response
          await offlineStorage.cacheResponse(endpoint, response.data);
          
          console.log(`✅ Action completed: ${actionName}`, response);
          return response.data;
        } else {
          // Offline - queue action
          console.log(`📵 Offline - queuing action: ${actionName}`);
          
          const queueId = await offlineSyncService.queueAction(
            actionName,
            endpoint,
            'POST',
            data
          );

          return {
            queued: true,
            queueId,
            message: `Action queued: ${actionName}. Will be synced when online.`,
          };
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message || 'Action failed';
        setError(errorMsg);
        console.error(`❌ Action failed: ${actionName}`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orderId]
  );

  /**
   * Accept order
   */
  const acceptOrder = useCallback(
    async () => {
      return executeAction(
        'Accept Order',
        API_ENDPOINTS.RIDER.ACCEPT_ORDER(orderId)
      );
    },
    [orderId, executeAction]
  );

  /**
   * Reject order
   */
  const rejectOrder = useCallback(
    async () => {
      return executeAction(
        'Reject Order',
        API_ENDPOINTS.RIDER.REJECT_ORDER(orderId)
      );
    },
    [orderId, executeAction]
  );

  /**
   * Arrived at pickup
   */
  const arrivedAtPickup = useCallback(
    async () => {
      return executeAction(
        'Arrived at Pickup',
        API_ENDPOINTS.RIDER.ARRIVED_AT_PICKUP(orderId)
      );
    },
    [orderId, executeAction]
  );

  /**
   * Pickup order
   */
  const pickupOrder = useCallback(
    async () => {
      return executeAction(
        'Pickup Order',
        API_ENDPOINTS.RIDER.PICKUP_ORDER(orderId)
      );
    },
    [orderId, executeAction]
  );

  /**
   * On the way
   */
  const onTheWay = useCallback(
    async () => {
      return executeAction(
        'On the Way',
        API_ENDPOINTS.RIDER.ON_THE_WAY(orderId)
      );
    },
    [orderId, executeAction]
  );

  /**
   * Delivery attempted
   */
  const deliveryAttempted = useCallback(
    async (reason = null) => {
      return executeAction(
        'Delivery Attempted',
        API_ENDPOINTS.RIDER.DELIVERY_ATTEMPTED(orderId),
        { reason }
      );
    },
    [orderId, executeAction]
  );

  /**
   * Deliver order
   */
  const deliverOrder = useCallback(
    async (signature = null, notes = null) => {
      return executeAction(
        'Deliver Order',
        API_ENDPOINTS.RIDER.DELIVER_ORDER(orderId),
        { signature, notes }
      );
    },
    [orderId, executeAction]
  );

  /**
   * Cancel delivery
   */
  const cancelDelivery = useCallback(
    async (reason = null) => {
      return executeAction(
        'Cancel Delivery',
        API_ENDPOINTS.RIDER.CANCEL_DELIVERY(orderId),
        { reason }
      );
    },
    [orderId, executeAction]
  );

  /**
   * Update location
   */
  const updateLocation = useCallback(
    async (latitude, longitude, accuracy = null) => {
      // Cache location to storage first
      await offlineStorage.saveLocation(orderId, latitude, longitude, accuracy);

      return executeAction(
        'Update Location',
        API_ENDPOINTS.RIDER.UPDATE_LOCATION(orderId),
        { latitude, longitude, accuracy }
      );
    },
    [orderId, executeAction]
  );

  /**
   * Get synchronization status for this order
   */
  const getSyncStatus = useCallback(
    async () => {
      return offlineSyncService.getSyncStatus();
    },
    []
  );

  return {
    // State
    isLoading,
    error,

    // Actions
    acceptOrder,
    rejectOrder,
    arrivedAtPickup,
    pickupOrder,
    onTheWay,
    deliveryAttempted,
    deliverOrder,
    cancelDelivery,
    updateLocation,

    // Utils
    getSyncStatus,
    isOnline: offlineSyncService.isOnline(),
  };
};

export default useOfflineDeliveryActions;
