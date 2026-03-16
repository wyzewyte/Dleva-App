import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerRestaurants = {
  // Get all restaurants with location filtering
  listRestaurants: async (latitude, longitude) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESTAURANTS.LIST, {
        params: {
          lat: latitude,
          lon: longitude,
        },
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRestaurants.listRestaurants', latitude, longitude });
      throw error.response?.data || { error: 'Failed to fetch restaurants' };
    }
  },

  // ✅ FIXED: Get single restaurant - use dedicated endpoint
  getRestaurant: async (restaurantId) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESTAURANTS.DETAIL(restaurantId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRestaurants.getRestaurant', restaurantId });
      throw error.response?.data || { error: 'Failed to fetch restaurant' };
    }
  },

  // Search restaurants
  searchRestaurants: async (query) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESTAURANTS.LIST, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRestaurants.searchRestaurants', query });
      throw error.response?.data || { error: 'Search failed' };
    }
  },

  // Get menu items for a restaurant
  getMenuItems: async (restaurantId) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESTAURANTS.MENU(restaurantId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerRestaurants.getMenuItems', restaurantId });
      throw error.response?.data || { error: 'Failed to fetch menu items' };
    }
  },
};

export default buyerRestaurants;