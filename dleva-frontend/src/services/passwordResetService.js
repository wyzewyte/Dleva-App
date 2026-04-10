/**
 * Generic Password Reset Service
 * Reusable for Riders, Buyers, and Sellers
 * Uses axios for proper API base URL configuration
 *
 * Usage:
 * import { riderPasswordReset, buyerPasswordReset } from './passwordResetService';
 * 
 * // Request OTP
 * await riderPasswordReset.requestPasswordReset('1234567890');
 * 
 * // Verify OTP
 * await riderPasswordReset.verifyResetCode('1234567890', '123456');
 * 
 * // Reset password
 * await riderPasswordReset.resetPassword('1234567890', '123456', 'newPassword123');
 */

import api from './axios';

class PasswordResetService {
  constructor(userTypePrefix) {
    // Store just the user type prefix (e.g., 'rider', 'buyer', 'seller')
    // axios will prepend the full API_BASE_URL
    this.userType = userTypePrefix; // e.g., 'rider', 'buyer', 'seller'
  }

  /**
   * Request password reset OTP
   * @param {string} phone_number - User's phone number
   * @returns {Promise<Object>} - { success, message, phone, expires_in_minutes }
   */
  async requestPasswordReset(phone_number) {
    try {
      const response = await api.post(`/${this.userType}/forgot-password/`, {
        phone_number,
      });

      return {
        success: true,
        message: response.data.message || 'Verification code sent',
        phone: response.data.phone || phone_number,
        expires_in_minutes: response.data.expires_in_minutes || 10,
      };
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Failed to send code';

      throw {
        error: errorMessage,
        status: error.response?.status || 500,
      };
    }
  }

  /**
   * Verify password reset OTP
   * @param {string} phone_number - User's phone number
   * @param {string} code - OTP code
   * @returns {Promise<Object>} - { success, message, verified }
   */
  async verifyResetCode(phone_number, code) {
    try {
      const response = await api.post(`/${this.userType}/verify-reset-code/`, {
        phone_number,
        code,
      });

      return {
        success: true,
        message: response.data.message || 'Code verified',
        verified: response.data.verified || true,
      };
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Invalid code';

      throw {
        error: errorMessage,
        status: error.response?.status || 500,
      };
    }
  }

  /**
   * Reset password with verified code
   * @param {string} phone_number - User's phone number
   * @param {string} code - OTP code (must be verified first)
   * @param {string} password - New password
   * @returns {Promise<Object>} - { success, message }
   */
  async resetPassword(phone_number, code, password) {
    try {
      const response = await api.post(`/${this.userType}/reset-password/`, {
        phone_number,
        code,
        password,
      });

      return {
        success: true,
        message: response.data.message || 'Password reset successfully',
      };
    } catch (error) {
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Failed to reset password';

      throw {
        error: errorMessage,
        status: error.response?.status || 500,
      };
    }
  }
}

// Create instances for different user types
export const riderPasswordReset = new PasswordResetService('rider');
export const buyerPasswordReset = new PasswordResetService('buyer');
export const sellerPasswordReset = new PasswordResetService('seller');

export default PasswordResetService;

