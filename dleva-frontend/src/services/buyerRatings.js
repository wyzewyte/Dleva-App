import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerRatings = {
  // Submit rating for restaurant/seller
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

  // Submit rating for rider
  rateRider: async (orderId, rating, comment = '') => {
    try {
      const response = await api.post(API_ENDPOINTS.RATINGS.SUBMIT_RIDER(orderId), {
        rating,
        comment,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRatings.rateRider', orderId });
      throw error.response?.data || { error: 'Failed to submit rider rating' };
    }
  },

  // Submit both ratings from a single buyer flow when available
  submitOrderFeedback: async ({ orderId, restaurantRating = 0, riderRating = 0, comment = '' }) => {
    try {
      if (!restaurantRating && !riderRating) {
        throw { error: 'Please select at least one rating before submitting.' };
      }

      const results = {};

      if (restaurantRating) {
        results.restaurant = await buyerRatings.rateOrder(orderId, restaurantRating, comment);
      }

      if (riderRating) {
        results.rider = await buyerRatings.rateRider(orderId, riderRating, comment);
      }

      return results;
    } catch (error) {
      logError(error, { context: 'buyerRatings.submitOrderFeedback', orderId });
      throw error.response?.data || error || { error: 'Failed to submit feedback' };
    }
  },
};

export default buyerRatings;
