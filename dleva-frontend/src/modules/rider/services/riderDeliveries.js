/**
 * Rider Deliveries Service
 * Handles all delivery/order API calls
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

/**
 * Extract error message from various backend response formats
 */
const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (error.error) return error.error;
  
  if (!error.response?.data) return error.message || defaultMsg;
  
  const data = error.response.data;
  
  // Handle serializer validation errors (Django DRF dict format)
  if (typeof data === 'object' && !data.error && !data.message) {
    const errorEntries = Object.entries(data);
    if (errorEntries.length > 0) {
      const [field, messages] = errorEntries[0];
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
      return `${field}: ${JSON.stringify(messages)}`;
    }
  }
  
  return data.error || data.message || defaultMsg;
};

const riderDeliveries = {
  // Get available orders that rider can accept
  async getAvailableOrders(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.distance) params.append('max_distance', filters.distance);
      if (filters.min_earnings) params.append('min_earnings', filters.min_earnings);
      if (filters.sorting) params.append('ordering', filters.sorting);

      const response = await api.get(`${API_ENDPOINTS.RIDER.AVAILABLE_ORDERS}?${params}`);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch available orders'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Get delivery fee estimate
  async estimateDeliveryFee(restaurantId, buyerId) {
    try {
      if (!restaurantId || !buyerId) {
        throw { error: 'Restaurant ID and Buyer ID are required', status: 400 };
      }
      
      const response = await api.post(API_ENDPOINTS.RIDER.ESTIMATE_FEE, {
        restaurant_id: restaurantId,
        buyer_id: buyerId,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to estimate delivery fee'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Accept an order
  async acceptOrder(orderId) {
    try {
      if (!orderId) {
        throw { error: 'Order ID is required', status: 400 };
      }
      
      const response = await api.post(API_ENDPOINTS.RIDER.ACCEPT_ORDER(orderId));
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to accept order'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Reject an order
  async rejectOrder(orderId, reason = '') {
    try {
      if (!orderId) {
        throw { error: 'Order ID is required', status: 400 };
      }
      
      const response = await api.post(API_ENDPOINTS.RIDER.REJECT_ORDER(orderId), {
        rejection_reason: reason,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to reject order'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Get order details
  async getOrderDetails(orderId) {
    try {
      if (!orderId) {
        throw { error: 'Order ID is required', status: 400 };
      }
      
      const response = await api.get(API_ENDPOINTS.RIDER.ORDER_STATUS(orderId));
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch order details'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Get active deliveries (orders rider has accepted)
  // Uses ORDERS endpoint which filters by rider and status
  async getActiveDeliveries() {
    try {
      // Backend endpoint /rider/orders/ returns all orders for current rider
      // Status filtering handled server-side based on order.rider = current_user.rider
      const response = await api.get(API_ENDPOINTS.RIDER.ORDERS);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch active deliveries'),
        status: error.response?.status || error.status,
      };
    }
  },
};

export default riderDeliveries;
