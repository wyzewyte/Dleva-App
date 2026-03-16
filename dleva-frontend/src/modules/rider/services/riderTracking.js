/**
 * Rider Tracking Service
 * Handles all delivery tracking API calls
 * Uses API_ENDPOINTS constants for all endpoints
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (error.error) return error.error;
  if (!error.response?.data) return error.message || defaultMsg;
  const data = error.response.data;
  if (typeof data === 'object' && !data.error && !data.message) {
    const errorEntries = Object.entries(data);
    if (errorEntries.length > 0) {
      const [field, messages] = errorEntries[0];
      if (Array.isArray(messages) && messages.length > 0) return messages[0];
      return `${field}: ${JSON.stringify(messages)}`;
    }
  }
  return data.error || data.message || defaultMsg;
};

const riderTracking = {
  /**
   * Get current delivery details and status
   */
  async getDeliveryDetails(orderId) {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      const response = await api.get(
        API_ENDPOINTS.RIDER.ORDER_STATUS(orderId)
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch delivery details'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Update rider location (GPS tracking)
   * Called periodically during delivery
   */
  async updateLocation(orderId, latitude, longitude, accuracy = null) {
    try {
      if (!orderId || latitude === null || longitude === null) {
        throw { error: 'Order ID and location coordinates are required', status: 400 };
      }

      const payload = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };

      if (accuracy !== null) {
        payload.accuracy = parseFloat(accuracy);
      }

      const response = await api.post(
        API_ENDPOINTS.RIDER.UPDATE_LOCATION(orderId),
        payload
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to update location'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Mark rider as arrived at pickup location
   * First step after accepting delivery
   */
  async arrivedAtPickup(orderId) {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      const response = await api.post(
        API_ENDPOINTS.RIDER.ARRIVED_AT_PICKUP(orderId)
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to confirm arrival'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Confirm pickup of items from restaurant
   * Verify all items are received
   */
  async confirmPickup(orderId, itemsVerified = true) {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      const response = await api.post(
        API_ENDPOINTS.RIDER.PICKUP_ORDER(orderId),
        { items_verified: itemsVerified }
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to confirm pickup'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Mark as on the way to delivery
   * Transitioning from pickup to delivery phase
   */
  async markOnTheWay(orderId) {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      const response = await api.post(
        API_ENDPOINTS.RIDER.ON_THE_WAY(orderId)
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to update status'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Record delivery attempt (customer unreachable, etc)
   * Can be called multiple times (max 3 attempts per backend config)
   */
  async attemptDelivery(orderId, reason = null) {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      const payload = {};
      if (reason) payload.reason = reason;
      
      const response = await api.post(
        API_ENDPOINTS.RIDER.DELIVERY_ATTEMPTED(orderId),
        payload
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to record delivery attempt'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Complete delivery with verification
   * Requires delivery PIN from customer
   * Optional: proof photo upload
   */
  async completeDelivery(orderId, deliveryPin, proofPhoto = null, notes = null) {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      if (!deliveryPin) throw { error: 'Delivery PIN is required', status: 400 };

      const formData = new FormData();
      formData.append('delivery_pin', deliveryPin);
      
      if (proofPhoto) {
        formData.append('proof_photo', proofPhoto);
      }
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await api.post(
        API_ENDPOINTS.RIDER.DELIVER_ORDER(orderId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to complete delivery'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Cancel delivery order
   * Reason required for audit trail
   */
  async cancelDelivery(orderId, reason = null) {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      const payload = { user_type: 'rider' };
      if (reason) payload.reason = reason;
      
      const response = await api.post(
        API_ENDPOINTS.RIDER.CANCEL_DELIVERY(orderId),
        payload
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to cancel delivery'),
        status: error.response?.status,
      };
    }
  },
};

export default riderTracking;
