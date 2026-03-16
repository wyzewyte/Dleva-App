import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

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
      Object.entries(data).forEach(([k, v]) => {
        // Only add defined/non-null values
        if (v !== undefined && v !== null && k !== 'imagePreview' && k !== 'id') {
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
      Object.entries(data).forEach(([k, v]) => {
        // Skip imagePreview, id, and null image (only add image if it's a File object)
        if (k === 'imagePreview' || k === 'id') return;
        if (k === 'image' && (v === null || typeof v === 'string')) return; // Skip if no new image
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