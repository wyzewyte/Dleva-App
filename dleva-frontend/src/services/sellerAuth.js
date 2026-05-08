import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerAuth = {
  requestPhoneOTP: async (phoneNumber) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_REQUEST_PHONE_OTP, {
        phone_number: phoneNumber.trim(),
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerAuth.requestPhoneOTP', phoneNumber });
      throw error.response?.data || { error: 'Failed to send phone verification code' };
    }
  },

  verifyPhoneOTP: async (phoneNumber, otpCode) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_VERIFY_PHONE_OTP, {
        phone_number: phoneNumber.trim(),
        otp_code: otpCode.trim(),
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerAuth.verifyPhoneOTP', phoneNumber });
      throw error.response?.data || { error: 'Invalid phone verification code' };
    }
  },

  requestEmailOTP: async (email, sellerName) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_REQUEST_EMAIL_OTP, {
        email: email.trim(),
        seller_name: sellerName?.trim() || 'Seller',
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerAuth.requestEmailOTP', email });
      throw error.response?.data || { error: 'Failed to send email verification code' };
    }
  },

  verifyEmailOTP: async (email, otpCode) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_VERIFY_EMAIL_OTP, {
        email: email.trim(),
        otp_code: otpCode.trim(),
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerAuth.verifyEmailOTP', email });
      throw error.response?.data || { error: 'Invalid email verification code' };
    }
  },

  // Register seller
  register: async (data) => {
    try {
      const payload = {
        username: data.username.trim(),
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone?.trim() || '',
        restaurant_name: data.restaurant_name.trim(),
        business_type: data.business_type || 'student_vendor',
        address: data.address?.trim() || '',
      };
      
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_REGISTER, payload);
      
      if (response.data.access) {
        localStorage.setItem('seller_access_token', response.data.access);
        localStorage.setItem('seller_refresh_token', response.data.refresh);
      }
      
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { error: 'Registration failed' };
      logError(error, { context: 'sellerAuth.register', payload: data });
      throw errorData;
    }
  },

  // Login seller
  login: async (username, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_LOGIN, {
        username,
        password,
      });
      
      if (response.data.access) {
        localStorage.setItem('seller_access_token', response.data.access);
        localStorage.setItem('seller_refresh_token', response.data.refresh);
      }
      
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerAuth.login', username });
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Logout seller
  logout: async () => {
    try {
      localStorage.removeItem('seller_access_token');
      localStorage.removeItem('seller_refresh_token');
      localStorage.removeItem('seller_profile');
      return { message: 'Logged out successfully' };
    } catch (error) {
      logError(error, { context: 'sellerAuth.logout' });
      return { message: 'Logged out' };
    }
  },
};

export default sellerAuth;
