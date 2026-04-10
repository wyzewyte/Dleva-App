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
      
      // ✅ IMPROVED: Extract all available error details for frontend display
      const serverData = error.response?.data;
      const statusCode = error.response?.status || error.status;
      
      // Build detailed error message
      let errorMessage = 'Failed to update order status';
      
      if (serverData?.message) {
        errorMessage = serverData.message;
      } else if (serverData?.error) {
        errorMessage = serverData.error;
      } else if (serverData?.detail) {
        errorMessage = serverData.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Add status code context for debugging
      if (statusCode === 400 && status === 'available_for_pickup') {
        errorMessage += '\n(Possible causes: No eligible riders, missing location, order in wrong status)';
      } else if (statusCode === 500) {
        errorMessage += '\n(Server error - please try again)';
      }
      
      console.error('[SELECT_ORDERS_ERROR]', {
        orderId,
        status,
        statusCode,
        serverData,
        message: errorMessage
      });
      
      throw {
        error: errorMessage,
        status: statusCode,
        details: serverData
      };
    }
  },
};

export default sellerOrders;