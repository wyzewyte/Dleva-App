import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerProfile = {
  getProfile: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.PROFILE);
      localStorage.setItem('dleva_user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerProfile.getProfile' });
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  updateProfile: async (data) => {
    try {
      let response;
      if (data.image instanceof File) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) formData.append(key, value);
        });
        response = await api.patch(API_ENDPOINTS.BUYER.PROFILE_UPDATE, formData);
      } else {
        response = await api.patch(API_ENDPOINTS.BUYER.PROFILE_UPDATE, data);
      }
      localStorage.setItem('dleva_user', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      logError(err, { context: 'buyerProfile.updateProfile' });
      throw err.response?.data || { error: 'Failed to update profile' };
    }
  },

  updateLocation: async (latitude, longitude, address) => {
    try {
      const response = await api.put(API_ENDPOINTS.BUYER.PROFILE_UPDATE, {
        latitude,
        longitude,
        address,
      });
      localStorage.setItem('dleva_user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerProfile.updateLocation', latitude, longitude });
      throw error.response?.data || { error: 'Failed to update location' };
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await api.post(API_ENDPOINTS.BUYER.CHANGE_PASSWORD, {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerProfile.changePassword' });
      throw error.response?.data || { error: 'Failed to change password' };
    }
  },

  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.BUYER.LOGOUT);
    } catch (error) {
      logError(error, { context: 'buyerProfile.logout' });
    } finally {
      localStorage.removeItem('buyer_access_token');
      localStorage.removeItem('buyer_refresh_token');
      localStorage.removeItem('dleva_user');
      localStorage.removeItem('cart');
      window.location.href = '/';
    }

    return { message: 'Logged out successfully' };
  },
};

export default buyerProfile;
