import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerMenu = {
  // Get menu items for a restaurant
  getMenuItems: async (restaurantId) => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER_MENU.GET_ITEMS(restaurantId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerMenu.getMenuItems', restaurantId });
      throw error.response?.data || { error: 'Failed to fetch menu' };
    }
  },

  // Get all menu items (for search/filter)
  getAllMenuItems: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER_MENU.ALL_ITEMS);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerMenu.getAllMenuItems' });
      throw error.response?.data || { error: 'Failed to fetch menu items' };
    }
  },

  // Get active menu categories for buyer search/filtering
  getCategories: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER_MENU.CATEGORIES);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerMenu.getCategories' });
      throw error.response?.data || { error: 'Failed to fetch menu categories' };
    }
  },

  // Search menu items
  searchMenu: async (query, options = {}) => {
    try {
      const params = { q: query };
      if (typeof options === 'string' || typeof options === 'number') {
        params.restaurant = options;
      } else if (options && typeof options === 'object') {
        if (options.restaurantId) params.restaurant = options.restaurantId;
        if (options.categoryId) params.category = options.categoryId;
        if (options.limit) params.limit = options.limit;
        if (options.offset) params.offset = options.offset;
      }
      
      const response = await api.get(API_ENDPOINTS.BUYER_MENU.SEARCH, { params });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerMenu.searchMenu', query, options });
      throw error.response?.data || { error: 'Search failed' };
    }
  },
};

export default buyerMenu;
