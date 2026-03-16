import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerSettings = {
  // Get seller profile + restaurant data
  getSettings: async () => {
    try {
      const [profileRes, restaurantRes] = await Promise.all([
        api.get(API_ENDPOINTS.SELLER.PROFILE),
        api.get(API_ENDPOINTS.SELLER.RESTAURANT_GET),
      ]);
      
      return {
        profile: profileRes.data,
        restaurant: restaurantRes.data,
      };
    } catch (error) {
      logError(error, { context: 'sellerSettings.getSettings' });
      throw error.response?.data || { error: 'Failed to fetch settings' };
    }
  },

  // Update seller profile
  updateProfile: async (data) => {
    try {
      const response = await api.patch(API_ENDPOINTS.SELLER.PROFILE_UPDATE, data);
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerSettings.updateProfile' });
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },

  // Update restaurant
  updateRestaurant: async (data) => {
    try {
      const response = await api.patch(API_ENDPOINTS.SELLER.RESTAURANT_UPDATE, data);
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerSettings.updateRestaurant' });
      throw error.response?.data || { error: 'Failed to update restaurant' };
    }
  },

  // Get payout details
  getPayoutDetails: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.PAYOUT_DETAILS);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No payout details yet
      }
      logError(error, { context: 'sellerSettings.getPayoutDetails' });
      throw error.response?.data || { error: 'Failed to fetch payout details' };
    }
  },

  // Update payout details
  updatePayoutDetails: async (data) => {
    try {
      const response = await api.post(API_ENDPOINTS.SELLER.PAYOUT_DETAILS, data);
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerSettings.updatePayoutDetails' });
      throw error.response?.data || { error: 'Failed to update payout details' };
    }
  },
};

export default sellerSettings;