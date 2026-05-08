import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

/**
 * Cloudinary Upload Service
 * Handles uploading images to Cloudinary via backend endpoints
 */
const cloudinaryUpload = {
  /**
   * Upload seller profile image to Cloudinary
   * @param {File} imageFile - Image file to upload
   * @returns {Promise} Response with public_id and secure URL
   */
  uploadProfileImage: async (imageFile) => {
    try {
      if (!imageFile) {
        throw { error: 'Image file is required', status: 400 };
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post(
        API_ENDPOINTS.SELLER.UPLOAD_PROFILE_IMAGE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return {
        success: true,
        public_id: response.data.public_id,
        url: response.data.url,
        format: response.data.format,
        size: response.data.size,
      };
    } catch (error) {
      logError(error, { context: 'cloudinaryUpload.uploadProfileImage' });
      throw {
        error: error.response?.data?.error || 'Failed to upload profile image',
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Upload restaurant image to Cloudinary
   * @param {File} imageFile - Image file to upload
   * @returns {Promise} Response with public_id and secure URL
   */
  uploadRestaurantImage: async (imageFile) => {
    try {
      if (!imageFile) {
        throw { error: 'Image file is required', status: 400 };
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post(
        API_ENDPOINTS.SELLER.UPLOAD_RESTAURANT_IMAGE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return {
        success: true,
        public_id: response.data.public_id,
        url: response.data.url,
        format: response.data.format,
        size: response.data.size,
      };
    } catch (error) {
      logError(error, { context: 'cloudinaryUpload.uploadRestaurantImage' });
      throw {
        error: error.response?.data?.error || 'Failed to upload restaurant image',
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Upload menu item image to Cloudinary
   * @param {File} imageFile - Image file to upload
   * @param {number} menuId - Menu item ID
   * @returns {Promise} Response with public_id and secure URL
   */
  uploadMenuItemImage: async (imageFile, menuId) => {
    try {
      if (!imageFile || !menuId) {
        throw { error: 'Image file and menu ID are required', status: 400 };
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post(
        API_ENDPOINTS.SELLER.UPLOAD_MENU_IMAGE(menuId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return {
        success: true,
        public_id: response.data.public_id,
        url: response.data.url,
        format: response.data.format,
        size: response.data.size,
      };
    } catch (error) {
      logError(error, { context: 'cloudinaryUpload.uploadMenuItemImage', menuId });
      throw {
        error: error.response?.data?.error || 'Failed to upload menu item image',
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise} Success response
   */
  deleteImage: async (publicId) => {
    try {
      if (!publicId) {
        throw { error: 'Public ID is required', status: 400 };
      }

      const response = await api.delete(API_ENDPOINTS.SELLER.DELETE_IMAGE, {
        data: { public_id: publicId },
      });

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      logError(error, { context: 'cloudinaryUpload.deleteImage', publicId });
      throw {
        error: error.response?.data?.error || 'Failed to delete image',
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {object} { valid: boolean, error: string }
   */
  validateFile: (file) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!file) {
      return { valid: false, error: 'Please select a file' };
    }

    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${MAX_SIZE / (1024 * 1024)}MB`,
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed',
      };
    }

    return { valid: true };
  },
};

export default cloudinaryUpload;
