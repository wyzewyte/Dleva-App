import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

/**
 * Phase 2: Location Management Service
 * Unified location operations for buyers and riders
 */

/**
 * Geocode an address to latitude/longitude
 * @param {string} address - Address to geocode
 * @returns {Promise} { latitude, longitude, address, city, area }
 */
export async function geocodeAddress(address) {
  try {
    const res = await api.post(API_ENDPOINTS.LOCATION.GEOCODE, { address });
    return res.data;
  } catch (error) {
    logError(error, { context: 'geocodeAddress', address });
    throw error;
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise} { address, city, area }
 */
export async function reverseGeocodeLocation(latitude, longitude) {
  try {
    const res = await api.get(API_ENDPOINTS.LOCATION.REVERSE_GEOCODE, {
      params: { latitude, longitude }
    });
    return res.data;
  } catch (error) {
    logError(error, { context: 'reverseGeocodeLocation', latitude, longitude });
    throw error;
  }
}

/**
 * Save or update user location (buyer or rider)
 * @param {string} locationType - 'buyer_delivery', 'buyer_home', 'rider_current'
 * @param {string} address - Full address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {string} city - Optional city
 * @param {string} area - Optional area/neighborhood
 * @returns {Promise} { success, location, validation }
 */
export async function saveUserLocation({
  locationType,
  address,
  latitude,
  longitude,
  city,
  area
}) {
  try {
    const res = await api.post(API_ENDPOINTS.LOCATION.SAVE, {
      location_type: locationType,
      address,
      latitude,
      longitude,
      city,
      area,
    });
    return res.data;
  } catch (error) {
    logError(error, {
      context: 'saveUserLocation',
      locationType,
      address
    });
    throw error;
  }
}

/**
 * Get current user location
 * @param {string} locationType - Optional filter by type
 * @returns {Promise} { location }
 */
export async function getCurrentUserLocation(locationType = null) {
  try {
    const params = {};
    if (locationType) {
      params.location_type = locationType;
    }
    const res = await api.get(API_ENDPOINTS.LOCATION.GET_CURRENT, { params });
    return res.data;
  } catch (error) {
    logError(error, { context: 'getCurrentUserLocation', locationType });
    throw error;
  }
}

/**
 * Get user location history
 * @param {string} locationType - Optional filter by type
 * @param {number} limit - Max records (default 10)
 * @returns {Promise} { count, locations }
 */
export async function getLocationHistory(locationType = null, limit = 10) {
  try {
    const params = { limit };
    if (locationType) {
      params.location_type = locationType;
    }
    const res = await api.get(API_ENDPOINTS.LOCATION.GET_HISTORY, { params });
    return res.data;
  } catch (error) {
    logError(error, { context: 'getLocationHistory', locationType });
    throw error;
  }
}

/**
 * Get recent saved locations (for dropdown)
 * @param {string} locationType - 'buyer_delivery', 'buyer_home', 'rider_current'
 * @param {number} limit - Max results (default 5)
 * @returns {Promise} { count, locations }
 */
export async function getRecentLocations(locationType, limit = 5) {
  try {
    const res = await api.get(API_ENDPOINTS.LOCATION.GET_RECENT, {
      params: { location_type: locationType, limit }
    });
    return res.data;
  } catch (error) {
    logError(error, { context: 'getRecentLocations', locationType });
    throw error;
  }
}

/**
 * Estimate delivery fee between two locations
 * @param {object} params - { pickupLocationId, deliveryLocationId } OR { pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude }
 * @returns {Promise} { distance_km, base_fee, distance_fee, total_fee, rider_earning, platform_commission }
 */
export async function estimateDeliveryFee(params) {
  try {
    const res = await api.post(API_ENDPOINTS.LOCATION.ESTIMATE_DELIVERY_FEE, {
      pickup_location_id: params.pickupLocationId,
      delivery_location_id: params.deliveryLocationId,
      pickup_latitude: params.pickupLatitude,
      pickup_longitude: params.pickupLongitude,
      delivery_latitude: params.deliveryLatitude,
      delivery_longitude: params.deliveryLongitude,
    });
    return res.data;
  } catch (error) {
    logError(error, { context: 'estimateDeliveryFee', params });
    throw error;
  }
}

/**
 * Get restaurants near a location
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {object} options - { radius, search, limit, offset }
 * @returns {Promise} { total_count, radius, restaurants }
 */
export async function getNearbyRestaurants(latitude, longitude, options = {}) {
  try {
    const params = {
      latitude,
      longitude,
      radius: options.radius || 15,
      limit: options.limit || 20,
      offset: options.offset || 0,
    };
    if (options.search) {
      params.search = options.search;
    }
    
    const res = await api.get(API_ENDPOINTS.LOCATION.GET_NEARBY_RESTAURANTS, { params });
    return res.data;
  } catch (error) {
    logError(error, {
      context: 'getNearbyRestaurants',
      latitude,
      longitude
    });
    throw error;
  }
}

/**
 * Old backward-compatible function for existing code
 * @deprecated Use saveUserLocation instead
 */
export async function saveLocation({ latitude, longitude, address }) {
  return saveUserLocation({
    locationType: 'buyer_delivery',
    address,
    latitude,
    longitude,
  });
}

export default {
  geocodeAddress,
  reverseGeocodeLocation,
  saveUserLocation,
  getCurrentUserLocation,
  getLocationHistory,
  getRecentLocations,
  estimateDeliveryFee,
  getNearbyRestaurants,
  saveLocation, // deprecated
};
