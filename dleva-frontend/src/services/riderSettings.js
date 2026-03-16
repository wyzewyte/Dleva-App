import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';

const extractErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (typeof error.response?.data === 'object') {
    const messages = Object.entries(error.response.data)
      .map(([key, val]) => Array.isArray(val) ? val[0] : val)
      .filter(Boolean);
    if (messages.length > 0) return messages[0];
  }
  return error.message || 'An error occurred';
};

const riderSettings = {
  // Get rider profile
  getProfile: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.PROFILE);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Update rider profile (name, phone, vehicle info)
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch(API_ENDPOINTS.RIDER.PROFILE, profileData);
      // Backend returns { message, profile } structure on PATCH
      return response.data.profile || response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Request phone OTP
  requestPhoneOtp: async (phoneNumber) => {
    try {
      const response = await api.post(API_ENDPOINTS.RIDER.REQUEST_PHONE_OTP, {
        phone_number: phoneNumber,
      });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Verify phone with OTP
  verifyPhone: async (otp) => {
    try {
      const response = await api.post(API_ENDPOINTS.RIDER.VERIFY_PHONE_OTP, {
        otp,
      });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Get verification status
  getVerificationStatus: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.VERIFICATION_STATUS);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Toggle online status
  toggleOnlineStatus: async (isOnline) => {
    try {
      const response = await api.post(API_ENDPOINTS.RIDER.TOGGLE_ONLINE, {
        is_online: isOnline,
      });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};

export default riderSettings;
