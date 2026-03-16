import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerProfile = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.PROFILE);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerProfile.getProfile' });
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  // Update profile
  updateProfile: async (data) => {
    try {
      let response;
      // build FormData if there is a file
      if (data.image instanceof File) {
        const formData = new FormData();
        Object.entries(data).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, v);
        });
        // use PATCH for partial updates; let axios set headers
        response = await api.patch(API_ENDPOINTS.BUYER.PROFILE_UPDATE, formData);
      } else {
        // no file -> send JSON
        response = await api.patch(API_ENDPOINTS.BUYER.PROFILE_UPDATE, data);
      }
      localStorage.setItem('dleva_user', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      logError(err, { context: 'buyerProfile.updateProfile' });
      throw err.response?.data || { error: 'Failed to update profile' };
    }
  },

  // Update location
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

  // Change password
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

  // ✅ FIXED: Logout with redirect
  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.BUYER.LOGOUT);
    } catch (error) {
      logError(error, { context: 'buyerProfile.logout' });
    } finally {
      // Always clear tokens and user data
      localStorage.removeItem('buyer_access_token');
      localStorage.removeItem('buyer_refresh_token');
      localStorage.removeItem('dleva_user');
      localStorage.removeItem('cart');

      // ✅ Redirect to home as guest user
      window.location.href = '/';

      return { message: 'Logged out successfully' };
    }
  },
};

export default buyerProfile;