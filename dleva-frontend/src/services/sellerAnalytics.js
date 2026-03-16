import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerAnalytics = {
  // Get analytics dashboard data
  getAnalytics: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.ANALYTICS);
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerAnalytics.getAnalytics' });
      throw error.response?.data || { error: 'Failed to fetch analytics' };
    }
  },

  // Get payments/payouts
  getPayments: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.PAYMENTS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      logError(error, { context: 'sellerAnalytics.getPayments' });
      throw error.response?.data || { error: 'Failed to fetch payments' };
    }
  },

  // Get reviews
  getReviews: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.REVIEWS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      logError(error, { context: 'sellerAnalytics.getReviews' });
      throw error.response?.data || { error: 'Failed to fetch reviews' };
    }
  },
};

export default sellerAnalytics;