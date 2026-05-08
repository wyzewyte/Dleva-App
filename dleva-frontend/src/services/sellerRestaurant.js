import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';
import cloudinaryUpload from './cloudinaryUpload';

const sellerRestaurant = {
  // Get or setup restaurant
  getRestaurant: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.RESTAURANT_GET);
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerRestaurant.getRestaurant' });
      throw error.response?.data || { error: 'Failed to fetch restaurant' };
    }
  },

  // Create/setup restaurant
  setupRestaurant: async (data) => {
    try {
      let response;
      if (data.image instanceof File) {
        const uploadResult = await cloudinaryUpload.uploadRestaurantImage(data.image);
        const formData = new FormData();
        Object.entries(data).forEach(([k, v]) => {
          if (v === null || k === 'image' || k === 'imagePreview') return;
          if (v !== undefined) formData.append(k, v);
        });
        formData.append('cloudinary_image_id', uploadResult.public_id);
        formData.append('cloudinary_image_url', uploadResult.url);
        response = await api.post(API_ENDPOINTS.SELLER.RESTAURANT_SETUP, formData);
      } else {
        response = await api.post(API_ENDPOINTS.SELLER.RESTAURANT_SETUP, data);
      }
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerRestaurant.setupRestaurant' });
      throw error.response?.data || { error: 'Failed to setup restaurant' };
    }
  },

  // Update restaurant
  updateRestaurant: async (data) => {
    try {
      let response;
      if (data.image instanceof File) {
        const uploadResult = await cloudinaryUpload.uploadRestaurantImage(data.image);
        const formData = new FormData();
        Object.entries(data).forEach(([k, v]) => {
          if (v === null || k === 'image' || k === 'imagePreview') return;
          if (v !== undefined) formData.append(k, v);
        });
        formData.append('cloudinary_image_id', uploadResult.public_id);
        formData.append('cloudinary_image_url', uploadResult.url);
        response = await api.patch(API_ENDPOINTS.SELLER.RESTAURANT_UPDATE, formData);
      } else {
        response = await api.patch(API_ENDPOINTS.SELLER.RESTAURANT_UPDATE, data);
      }
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerRestaurant.updateRestaurant' });
      throw error.response?.data || { error: 'Failed to update restaurant' };
    }
  },
};

export default sellerRestaurant;