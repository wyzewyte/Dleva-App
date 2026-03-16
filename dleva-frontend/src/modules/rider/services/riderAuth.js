/**
 * Rider Authentication Service
 * Handles all rider authentication API calls
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

/**
 * Extract error message from various backend response formats
 */
const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (error.error) return error.error; // Pre-formatted error
  
  if (!error.response?.data) return error.message || defaultMsg;
  
  const data = error.response.data;
  
  // Handle serializer validation errors (Django DRF dict format)
  if (typeof data === 'object' && !data.error && !data.message) {
    const errorEntries = Object.entries(data);
    if (errorEntries.length > 0) {
      const [field, messages] = errorEntries[0];
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
      return `${field}: ${JSON.stringify(messages)}`;
    }
  }
  
  // Handle standard error/message format
  return data.error || data.message || defaultMsg;
};

const riderAuth = {
  /**
   * Register a new rider
   */
  async register(username, email, password, full_name, phone_number, vehicle_type, vehicle_plate_number) {
    try {
      // Validate inputs
      if (!username || !email || !password || !full_name || !phone_number || !vehicle_type || !vehicle_plate_number) {
        throw {
          error: 'All fields are required',
          status: 400,
        };
      }

      const response = await api.post(API_ENDPOINTS.RIDER.REGISTER, {
        username,
        email,
        password,
        password_confirm: password,
        full_name,
        phone_number,
        vehicle_type,
        vehicle_plate_number,
      });
      
      if (response.data.access || response.data.access_token) {
        const token = response.data.access || response.data.access_token;
        const refresh = response.data.refresh || response.data.refresh_token;
        localStorage.setItem('rider_access_token', token);
        if (refresh) {
          localStorage.setItem('rider_refresh_token', refresh);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Registration failed'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Login rider with credentials
   */
  async login(email, password) {
    try {
      // Validate inputs before sending
      if (!email || !password) {
        throw {
          error: 'Email and password are required',
          status: 400,
        };
      }

      const response = await api.post(API_ENDPOINTS.RIDER.LOGIN, {
        email,
        password,
      });

      const token = response.data.access || response.data.access_token;
      if (!token) throw new Error('No access token received');

      const refresh = response.data.refresh || response.data.refresh_token;
      localStorage.setItem('rider_access_token', token);
      if (refresh) {
        localStorage.setItem('rider_refresh_token', refresh);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Login failed'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Request phone OTP
   */
  async requestPhoneOTP(phone_number) {
    try {
      if (!phone_number) {
        throw { error: 'Phone number is required', status: 400 };
      }
      
      const response = await api.post(API_ENDPOINTS.RIDER.REQUEST_PHONE_OTP, {
        phone_number,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to send OTP'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Verify phone OTP
   */
  async verifyPhoneOTP(phone_number, otp) {
    try {
      if (!phone_number || !otp) {
        throw { error: 'Phone number and OTP are required', status: 400 };
      }
      
      const response = await api.post(API_ENDPOINTS.RIDER.VERIFY_PHONE_OTP, {
        phone_number,
        otp,
      });

      if (response.data.access) {
        localStorage.setItem('seller_access_token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }

      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'OTP verification failed'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Fetch current rider profile
   */
  async getProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.PROFILE);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch profile'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Logout rider
   */
  async logout() {
    try {
      await api.post(API_ENDPOINTS.RIDER.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('rider_access_token');
      localStorage.removeItem('rider_refresh_token');
      localStorage.removeItem('rider_profile');
      delete api.defaults.headers.common['Authorization'];
    }
  },
};

export default riderAuth;
