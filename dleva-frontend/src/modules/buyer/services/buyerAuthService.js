import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

/**
 * Buyer Authentication Service
 * Handles signup with separate phone and email OTP verification
 */
const buyerAuthService = {
  /**
   * Request OTP for phone verification
   * @param {string} phoneNumber - Buyer's phone number
   * @returns {Promise<Object>} Response with OTP sent confirmation
   */
  requestPhoneOTP: async (phoneNumber) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_REQUEST_PHONE_OTP, {
      phone_number: phoneNumber.trim(),
    });
    return response.data;
  },

  /**
   * Verify phone OTP code
   * @param {string} phoneNumber - Buyer's phone number
   * @param {string} otpCode - The OTP code from SMS
   * @returns {Promise<Object>} Response with verification confirmation
   */
  verifyPhoneOTP: async (phoneNumber, otpCode) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_VERIFY_PHONE_OTP, {
      phone_number: phoneNumber.trim(),
      otp_code: otpCode.trim(),
    });
    return response.data;
  },

  /**
   * Request OTP for email verification
   * @param {string} email - Buyer's email
   * @returns {Promise<Object>} Response with OTP sent confirmation
   */
  requestEmailOTP: async (email) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_REQUEST_EMAIL_OTP, {
      email: email.trim(),
    });
    return response.data;
  },

  /**
   * Verify email OTP code
   * @param {string} email - Buyer's email
   * @param {string} otpCode - The OTP code from email
   * @returns {Promise<Object>} Response with verification confirmation
   */
  verifyEmailOTP: async (email, otpCode) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_VERIFY_EMAIL_OTP, {
      email: email.trim(),
      otp_code: otpCode.trim(),
    });
    return response.data;
  },

  /**
   * Complete buyer registration after phone and email verification
   * @param {Object} formData - Registration data
   * @param {string} formData.name - Full name
   * @param {string} formData.email - Email address
   * @param {string} formData.phone_number - Phone number
   * @param {string} formData.username - Username
   * @param {string} formData.password - Password
   * @returns {Promise<Object>} User data with auth tokens
   */
  register: async (formData) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_REGISTER, formData);
    return response.data;
  },

  /**
   * Login buyer
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} User data with auth tokens
   */
  login: async (username, password) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_LOGIN, {
      username,
      password,
    });
    return response.data;
  },

  /**
   * Request password reset OTP
   * @param {string} phoneNumber - Buyer's registered phone number
   * @returns {Promise<Object>} Response with OTP sent confirmation
   */
  requestPasswordReset: async (phoneNumber) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_FORGOT_PASSWORD, {
      phone_number: phoneNumber,
    });
    return response.data;
  },

  /**
   * Verify password reset OTP code
   * @param {string} phoneNumber - Buyer's phone number
   * @param {string} otpCode - The OTP code from SMS/email
   * @returns {Promise<Object>} Response with verification confirmation
   */
  verifyPasswordResetCode: async (phoneNumber, otpCode) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_VERIFY_RESET_CODE, {
      phone_number: phoneNumber,
      code: otpCode,
    });
    return response.data;
  },

  /**
   * Reset password after OTP verification
   * @param {string} phoneNumber - Buyer's phone number
   * @param {string} otpCode - The verified OTP code
   * @param {string} password - New password
   * @returns {Promise<Object>} Response with reset confirmation
   */
  resetPassword: async (phoneNumber, otpCode, password) => {
    const response = await api.post(API_ENDPOINTS.AUTH.BUYER_RESET_PASSWORD, {
      phone_number: phoneNumber,
      code: otpCode,
      password,
    });
    return response.data;
  },

  /**
   * Logout buyer
   * @returns {Promise<void>}
   */
  logout: async () => {
    await api.post(API_ENDPOINTS.AUTH.BUYER_LOGIN);
  },
};

export default buyerAuthService;
