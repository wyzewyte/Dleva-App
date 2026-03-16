/**
 * Rider Orders Service
 * Comprehensive order management API calls
 * Note: Some methods (getAvailableOrders, acceptOrder) are also in riderDeliveries
 * This service provides a unified orders interface with additional history/analytics
 */

import api from '../../../services/axios';
import { API_ENDPOINTS, getAPIUrl } from '../../../constants/apiConfig';

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

/**
 * Map status strings to appropriate API endpoints
 * Standardizes order status updates across the application
 */
const mapStatusToEndpoint = (orderId, status) => {
  const statusMap = {
    'arrived_at_pickup': API_ENDPOINTS.RIDER.ARRIVED_AT_PICKUP,
    'picked_up': API_ENDPOINTS.RIDER.PICKUP_ORDER,
    'on_the_way': API_ENDPOINTS.RIDER.ON_THE_WAY,
    'delivery_attempted': API_ENDPOINTS.RIDER.DELIVERY_ATTEMPTED,
    'delivered': API_ENDPOINTS.RIDER.DELIVER_ORDER,
    'cancel': API_ENDPOINTS.RIDER.CANCEL_DELIVERY,
  };

  const endpoint = statusMap[status.toLowerCase()];
  if (!endpoint) {
    throw { error: `Invalid order status: ${status}`, status: 400 };
  }

  return endpoint(orderId);
};

const riderOrders = {
  /**
   * Get all available orders that rider can accept
   * @param {Object} filters - Optional filters (distance, min_earnings, sorting)
   * @returns {Promise} List of available orders
   */
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

  /**
   * Get all active orders (accepted but not yet completed)
   * @returns {Promise} List of active orders
   */
  async getActiveOrders() {
    try {
      // Debug: log the configured endpoint and full URL before requesting
      const endpointPath = API_ENDPOINTS.RIDER.ORDERS;
      const fullUrl = getAPIUrl(endpointPath);
      // eslint-disable-next-line no-console
      console.debug('[riderOrders] getActiveOrders -> endpointPath:', endpointPath, 'fullUrl:', fullUrl);

      // The backend exposes rider orders at '/api/rider/orders/' which
      // returns { count, orders }. Only returns orders where order.rider = authenticated_rider
      // Normalize to { active_orders: [...] } for compatibility
      const response = await api.get(endpointPath);
      const orders = Array.isArray(response.data.orders) ? response.data.orders : response.data.results || [];
      return { active_orders: orders };
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch active orders'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Get order history (completed and cancelled orders)
   * @param {Object} params - Optional query parameters (limit, offset, date_range, status)
   * @returns {Promise} List of past orders
   */
  async getOrderHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.status) queryParams.append('status', params.status); // 'completed', 'cancelled'
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);

      const response = await api.get(`${API_ENDPOINTS.RIDER.ORDERS}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch order history'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Get detailed information about a specific order
   * @param {number|string} orderId - The order ID
   * @returns {Promise} Order details
   */
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

  /**
   * Accept an order
   * @param {number|string} orderId - The order ID to accept
   * @returns {Promise} Updated order data
   */
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

  /**
   * Reject an order
   * @param {number|string} orderId - The order ID to reject
   * @param {string} reason - Optional reason for rejection
   * @returns {Promise} Updated order data
   */
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

  /**
   * Update order status to next step in delivery lifecycle
   * Supports multiple statuses: arrived_at_pickup, pickup, on_the_way, 
   * delivery_attempted, delivered, release, cancel
   * 
   * @param {number|string} orderId - The order ID
   * @param {string} status - The new status
   * @param {Object} data - Optional additional data for the update
   * @returns {Promise} Updated order data
   */
  async updateOrderStatus(orderId, status, data = {}) {
    try {
      if (!orderId) {
        throw { error: 'Order ID is required', status: 400 };
      }
      if (!status) {
        throw { error: 'Status is required', status: 400 };
      }

      const endpoint = mapStatusToEndpoint(orderId, status);
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, `Failed to update order status to ${status}`),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Mark order as delivered (complete delivery)
   * @param {number|string} orderId - The order ID
   * @param {Object} data - Optional delivery completion data
   * @returns {Promise} Updated order data
   */
  async completeOrder(orderId, data = {}) {
    try {
      if (!orderId) {
        throw { error: 'Order ID is required', status: 400 };
      }

      const response = await api.post(API_ENDPOINTS.RIDER.DELIVER_ORDER(orderId), data);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to complete order'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Cancel an active delivery
   * @param {number|string} orderId - The order ID to cancel
   * @param {string} reason - Optional reason for cancellation
   * @returns {Promise} Updated order data
   */
  async cancelOrder(orderId, reason = '') {
    try {
      if (!orderId) {
        throw { error: 'Order ID is required', status: 400 };
      }

      const response = await api.post(API_ENDPOINTS.RIDER.CANCEL_DELIVERY(orderId), {
        cancellation_reason: reason,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to cancel order'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Update rider's location for a specific order
   * @param {number|string} orderId - The order ID
   * @param {number} latitude - Current latitude
   * @param {number} longitude - Current longitude
   * @returns {Promise} Location update confirmation
   */
  async updateOrderLocation(orderId, latitude, longitude) {
    try {
      if (!orderId || latitude === undefined || longitude === undefined) {
        throw { error: 'Order ID, latitude, and longitude are required', status: 400 };
      }

      const response = await api.post(API_ENDPOINTS.RIDER.UPDATE_LOCATION(orderId), {
        latitude,
        longitude,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to update location'),
        status: error.response?.status || error.status,
      };
    }
  },
};

export default riderOrders;
