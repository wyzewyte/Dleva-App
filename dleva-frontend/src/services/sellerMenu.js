import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';
import cloudinaryUpload from './cloudinaryUpload';

const sellerMenu = {
  // Get all menu items
  getMenuItems: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.MENU);
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerMenu.getMenuItems' });
      throw error.response?.data || { error: 'Failed to fetch menu items' };
    }
  },

  // Add menu item
  addMenuItem: async (data) => {
    try {
      const formData = new FormData();
      
      // If there's a new image, upload to Cloudinary first
      if (data.image instanceof File) {
        const uploadResult = await cloudinaryUpload.uploadProfileImage(data.image);
        formData.append('cloudinary_image_id', uploadResult.public_id);
        formData.append('cloudinary_image_url', uploadResult.url);
      } else if (data.cloudinary_image_id) {
        // Use existing cloudinary IDs
        formData.append('cloudinary_image_id', data.cloudinary_image_id);
        formData.append('cloudinary_image_url', data.cloudinary_image_url);
      }

      // Add other fields
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== 'imagePreview' && k !== 'id' && k !== 'image' && !k.startsWith('cloudinary')) {
          formData.append(k, v);
        }
      });
      
      const response = await api.post(API_ENDPOINTS.SELLER.MENU_ADD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerMenu.addMenuItem', payload: data.name });
      throw error.response?.data || { error: 'Failed to add menu item' };
    }
  },

  // Update menu item
  updateMenuItem: async (id, data) => {
    try {
      const formData = new FormData();
      
      // If there's a new image, upload to Cloudinary
      if (data.image instanceof File) {
        const uploadResult = await cloudinaryUpload.uploadMenuItemImage(data.image, id);
        formData.append('cloudinary_image_id', uploadResult.public_id);
        formData.append('cloudinary_image_url', uploadResult.url);
      } else if (data.cloudinary_image_id) {
        // Use existing cloudinary IDs
        formData.append('cloudinary_image_id', data.cloudinary_image_id);
        formData.append('cloudinary_image_url', data.cloudinary_image_url);
      }

      // Add other fields (skip image file, imagePreview, id, and cloudinary fields)
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'imagePreview' || k === 'id') return;
        if (k === 'image' && (v === null || typeof v === 'string')) return; // Skip if no new image
        if (k.startsWith('cloudinary')) return; // Already handled above
        if (v !== undefined && v !== null) {
          formData.append(k, v);
        }
      });

      const response = await api.patch(API_ENDPOINTS.SELLER.MENU_UPDATE(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerMenu.updateMenuItem', id });
      throw error.response?.data || { error: 'Failed to update menu item' };
    }
  },

  // Delete menu item
  deleteMenuItem: async (id) => {
    try {
      const response = await api.delete(API_ENDPOINTS.SELLER.MENU_DELETE(id));
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerMenu.deleteMenuItem', id });
      throw error.response?.data || { error: 'Failed to delete menu item' };
    }
  },
};

export default sellerMenu;