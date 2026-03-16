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

  // Search menu items
  searchMenu: async (query, restaurantId = null) => {
    try {
      const params = { q: query };
      if (restaurantId) params.restaurant = restaurantId;
      
      const response = await api.get(API_ENDPOINTS.BUYER_MENU.SEARCH, { params });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerMenu.searchMenu', query });
      throw error.response?.data || { error: 'Search failed' };
    }
  },
};

export default buyerMenu;