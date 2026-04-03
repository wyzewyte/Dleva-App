import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const MAX_DISTANCE_KM = 5;

const normalizeRestaurant = (restaurant) => {
  if (!restaurant || typeof restaurant !== 'object') return restaurant;

  return {
    ...restaurant,
    is_open: restaurant.is_open ?? restaurant.is_active ?? true,
  };
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

const filterRestaurantsWithinRange = (restaurants, latitude, longitude) => {
  const userLat = toNumber(latitude);
  const userLon = toNumber(longitude);

  if (!Array.isArray(restaurants) || userLat == null || userLon == null) {
    return restaurants;
  }

  return restaurants.filter((restaurant) => {
    const restaurantLat = toNumber(restaurant?.latitude);
    const restaurantLon = toNumber(restaurant?.longitude);

    if (restaurantLat == null || restaurantLon == null) {
      return true;
    }

    return haversineDistanceKm(userLat, userLon, restaurantLat, restaurantLon) <= MAX_DISTANCE_KM;
  });
};

const buyerRestaurants = {
  // Get all restaurants with location filtering
  listRestaurants: async (latitude, longitude, options = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESTAURANTS.LIST, {
        params: {
          lat: latitude,
          lon: longitude,
          ...(options.q ? { q: options.q } : {}),
          ...(options.limit ? { limit: options.limit } : {}),
          ...(options.offset ? { offset: options.offset } : {}),
        },
      });
      if (Array.isArray(response.data)) {
        return filterRestaurantsWithinRange(response.data.map(normalizeRestaurant), latitude, longitude);
      }

      const normalizedResults = Array.isArray(response.data?.results)
        ? response.data.results.map(normalizeRestaurant)
        : response.data?.results;

      return {
        ...response.data,
        results: filterRestaurantsWithinRange(normalizedResults, latitude, longitude),
      };
    } catch (error) {
      logError(error, { context: 'buyerRestaurants.listRestaurants', latitude, longitude, options });
      throw error.response?.data || { error: 'Failed to fetch restaurants' };
    }
  },

  // ✅ FIXED: Get single restaurant - use dedicated endpoint
  getRestaurant: async (restaurantId) => {
    try {
      const response = await api.get(API_ENDPOINTS.RESTAURANTS.DETAIL(restaurantId));
      return normalizeRestaurant(response.data);
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
      if (Array.isArray(response.data)) {
        return response.data.map(normalizeRestaurant);
      }

      return {
        ...response.data,
        results: Array.isArray(response.data?.results)
          ? response.data.results.map(normalizeRestaurant)
          : response.data?.results,
      };
    } catch (error) {
      logError(error, { context: 'buyerRestaurants.searchRestaurants', query });
      throw error.response?.data || { error: 'Search failed' };
    }
  },

  // Search nearby restaurants for the buyer's current location
  searchNearbyRestaurants: async (query, latitude, longitude, options = {}) => {
    try {
      return await buyerRestaurants.listRestaurants(latitude, longitude, {
        q: query,
        limit: options.limit,
        offset: options.offset,
      });
    } catch (error) {
      logError(error, { context: 'buyerRestaurants.searchNearbyRestaurants', query, latitude, longitude, options });
      throw error;
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
