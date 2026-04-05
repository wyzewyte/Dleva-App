/**
 * Rider Settings Service
 * Handles all profile, preferences, and settings API calls
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (error.error) return error.error;
  if (!error.response?.data) return error.message || defaultMsg;
  const data = error.response.data;
  if (typeof data === 'object' && !data.error && !data.message) {
    const errorEntries = Object.entries(data);
    if (errorEntries.length > 0) {
      const [field, messages] = errorEntries[0];
      if (Array.isArray(messages) && messages.length > 0) return messages[0];
      return `${field}: ${JSON.stringify(messages)}`;
    }
  }
  return data.error || data.message || defaultMsg;
};

const riderSettings = {
  /**
   * Get rider profile
   */
  async getProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.PROFILE);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch profile'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Update rider profile
   */
  async updateProfile(data) {
    try {
      const response = await api.patch(API_ENDPOINTS.RIDER.PROFILE, data);
      return response.data.profile || response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to update profile'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Verify phone number with OTP
   */
  async verifyPhone(otp, phoneNumber = null) {
    try {
      const payload = { otp_code: otp };
      if (phoneNumber) {
        payload.phone_number = phoneNumber;
      }
      const response = await api.post(API_ENDPOINTS.RIDER.VERIFY_PHONE_OTP, payload);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to verify phone'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Request phone verification OTP
   */
  async requestPhoneOtp(phoneNumber) {
    try {
      const response = await api.post(API_ENDPOINTS.RIDER.REQUEST_PHONE_OTP, {
        phone_number: phoneNumber,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to request OTP'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Resend phone verification OTP
   */
  async resendPhoneOtp(phoneNumber) {
    try {
      const response = await api.post(API_ENDPOINTS.RIDER.RESEND_PHONE_OTP, {
        phone_number: phoneNumber,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to resend OTP'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get verification status
   */
  async getVerificationStatus() {
    try {
      const response = await api.get(
        API_ENDPOINTS.RIDER.VERIFICATION_STATUS
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch verification status'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Toggle online/offline status
   */
  async toggleOnlineStatus(isOnline) {
    try {
      const response = await api.post(
        API_ENDPOINTS.RIDER.TOGGLE_ONLINE,
        { is_online: isOnline }
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to update status'),
        status: error.response?.status,
      };
    }
  },
};

export default riderSettings;
