import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerRatings = {
  // Submit rating for order
  rateOrder: async (orderId, rating, comment = '') => {
    try {
      const response = await api.post(API_ENDPOINTS.RATINGS.SUBMIT, {
        order_id: orderId,
        rating: rating,
        comment: comment,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRatings.rateOrder', orderId });
      throw error.response?.data || { error: 'Failed to submit rating' };
    }
  },

  // Get rating for specific order
  getOrderRating: async (orderId) => {
    try {
      const response = await api.get(API_ENDPOINTS.RATINGS.GET_ORDER_RATING(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRatings.getOrderRating', orderId });
      throw error.response?.data || { error: 'Failed to fetch rating' };
    }
  },

  // Update rating
  updateRating: async (orderId, rating, comment = '') => {
    try {
      const response = await api.put(API_ENDPOINTS.RATINGS.UPDATE_RATING(orderId), {
        rating: rating,
        comment: comment,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRatings.updateRating', orderId });
      throw error.response?.data || { error: 'Failed to update rating' };
    }
  },

  // Delete rating
  deleteRating: async (orderId) => {
    try {
      await api.delete(API_ENDPOINTS.RATINGS.DELETE_RATING(orderId));
      return { message: 'Rating deleted' };
    } catch (error) {
      logError(error, { context: 'buyerRatings.deleteRating', orderId });
      throw error.response?.data || { error: 'Failed to delete rating' };
    }
  },

  // Get all ratings by current user
  getMyRatings: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.RATINGS.GET_MY_RATINGS);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRatings.getMyRatings' });
      throw error.response?.data || { error: 'Failed to fetch ratings' };
    }
  },
};

export default buyerRatings;