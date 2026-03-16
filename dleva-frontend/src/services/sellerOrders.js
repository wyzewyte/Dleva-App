import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerOrders = {
  // Get all orders for seller
  getOrders: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.ORDERS);
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      logError(error, { context: 'sellerOrders.getOrders' });
      throw error.response?.data || { error: 'Failed to fetch orders' };
    }
  },

  // Update order status
  // ✅ IMPORTANT: Use different endpoints based on status
  updateOrderStatus: async (orderId, status) => {
    try {
      // When marking as "available_for_pickup", use the mark-ready endpoint to trigger rider assignment
      if (status === 'available_for_pickup') {
        console.log(`📍 Order ${orderId}: Triggering rider assignment...`);
        const response = await api.post(API_ENDPOINTS.SELLER.ORDER_MARK_READY(orderId), {});
        console.log('✅ Rider assignment triggered:', response.data);
        return response.data;
      } else {
        // For other status changes, use regular update endpoint
        console.log(`📝 Order ${orderId}: Updating status to ${status}...`);
        const response = await api.post(API_ENDPOINTS.SELLER.ORDER_UPDATE_STATUS(orderId), {
          status,
        });
        console.log('✅ Status updated:', response.data);
        return response.data;
      }
    } catch (error) {
      logError(error, { context: 'sellerOrders.updateOrderStatus', orderId, status });
      // Prefer server-provided message or fall back to Axios/message
      const serverData = error.response?.data;
      const serverMsg = serverData?.message || serverData?.error || serverData?.detail;
      const message = serverMsg || error.message || 'Failed to update order status';
      throw { error: message, status: error.response?.status || error.status, details: serverData };
    }
  },
};

export default sellerOrders;