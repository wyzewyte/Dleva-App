import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerProfile = {
  // Get seller profile
  getProfile: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.PROFILE);
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerProfile.getProfile' });
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  // Update seller profile
  updateProfile: async (data) => {
    try {
      let response;
      if (data.image instanceof File) {
        const formData = new FormData();
        Object.entries(data).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, v);
        });
        response = await api.patch(API_ENDPOINTS.SELLER.PROFILE_UPDATE, formData);
      } else {
        response = await api.patch(API_ENDPOINTS.SELLER.PROFILE_UPDATE, data);
      }
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerProfile.updateProfile' });
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },
};

export default sellerProfile;