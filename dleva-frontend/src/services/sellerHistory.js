import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerHistory = {
  // Get all orders (for history)
  getOrderHistory: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.ORDERS, { params });
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      logError(error, { context: 'sellerHistory.getOrderHistory' });
      throw error.response?.data || { error: 'Failed to fetch order history' };
    }
  },

  // Get payouts - gracefully handle if endpoint doesn't exist yet
  getPayouts: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.PAYOUTS, { params });
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      // If endpoint doesn't exist, return empty array instead of throwing
      if (error.response?.status === 404) {
        logError(error, { context: 'sellerHistory.getPayouts', severity: 'warning' });
        return [];
      }
      logError(error, { context: 'sellerHistory.getPayouts' });
      throw error.response?.data || { error: 'Failed to fetch payouts' };
    }
  },
};

export default sellerHistory;