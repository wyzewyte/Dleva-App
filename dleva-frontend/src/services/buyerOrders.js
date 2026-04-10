import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerOrders = {
  listOrders: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ORDERS);
      // ✅ FIXED: Backend returns array directly, not paginated
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      logError(error, { context: 'buyerOrders.listOrders' });
      throw error.response?.data || { error: 'Failed to fetch orders' };
    }
  },

  getOrder: async (orderId) => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ORDER_DETAIL(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerOrders.getOrder', orderId });
      throw error.response?.data || { error: 'Failed to fetch order details' };
    }
  },

  getOrderStatus: async (orderId) => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ORDER_DETAIL(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerOrders.getOrderStatus', orderId });
      throw error.response?.data || { error: 'Failed to fetch order status' };
    }
  },

  cancelOrder: async (orderId, reason = '') => {
    try {
      const response = await api.post(API_ENDPOINTS.BUYER.ORDER_CANCEL(orderId), {
        reason: reason,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerOrders.cancelOrder', orderId });
      throw error.response?.data || { error: 'Failed to cancel order' };
    }
  },

  getHistory: async (page = 1, pageSize = 10) => {
    try {
      // ✅ Just fetch all and handle pagination on frontend if needed
      const response = await api.get(API_ENDPOINTS.BUYER.ORDERS);
      const allOrders = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      // Optional: slice for pagination on frontend
      const offset = (page - 1) * pageSize;
      return allOrders.slice(offset, offset + pageSize);
    } catch (error) {
      logError(error, { context: 'buyerOrders.getHistory', page, pageSize });
      throw error.response?.data || { error: 'Failed to fetch order history' };
    }
  },

  searchOrders: async (query) => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ORDERS);
      const allOrders = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      // ✅ Filter on frontend
      return allOrders.filter(order => 
        order.restaurant_name?.toLowerCase().includes(query.toLowerCase()) ||
        order.id.toString().includes(query)
      );
    } catch (error) {
      logError(error, { context: 'buyerOrders.searchOrders', query });
      throw error.response?.data || { error: 'Search failed' };
    }
  },

  getActiveOrders: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ORDERS);
      const allOrders = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      // ✅ Filter active orders on frontend
      return allOrders.filter(order =>
        ['pending', 'confirming', 'preparing', 'available_for_pickup', 'awaiting_rider', 'assigned', 'arrived_at_pickup', 'picked_up', 'on_the_way', 'delivery_attempted'].includes(order.status)
      );
    } catch (error) {
      logError(error, { context: 'buyerOrders.getActiveOrders' });
      throw error.response?.data || { error: 'Failed to fetch active orders' };
    }
  },
};

export default buyerOrders;
