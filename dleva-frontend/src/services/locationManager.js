/**
 * Location Manager Service - Phase 3
 * Unified location handling for GPS, API calls, and distance calculations
 *
 * Responsibilities:
 * - GPS geolocation requests
 * - API communication with backend
 * - Address geocoding/reverse geocoding
 * - Delivery fee estimation
 * - Recent locations management
 * - Location persistence
 */

import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const STORAGE_KEYS = {
  CURRENT_LOCATION: 'dleva_current_location',
  RECENT_LOCATIONS: 'dleva_recent_locations',
  LOCATION_TYPE: 'dleva_location_type',
  LAST_GPS_REQUEST: 'dleva_last_gps_request',
};

const GPS_CONFIG = {
  QUICK_TIMEOUT: 8000,
  FALLBACK_TIMEOUT: 20000,
  ENABLE_HIGH_ACCURACY: true,
  QUICK_HIGH_ACCURACY: false,
  MAX_AGE: 300000, // 5 minutes
  CACHE_DURATION: 300000, // 5 minutes
};

export class LocationManager {
  constructor() {
    this.currentLocation = null;
    this.recentLocations = [];
    this.locationType = 'buyer_delivery';
    this.gpsWatcher = null;
    this.listeners = [];
    this.initFromStorage();
  }

  /**
   * Initialize location from local storage
   * Checks for both authenticated user location and guest location
   */
  initFromStorage() {
    try {
      // First try to load authenticated user location
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_LOCATION);
      if (stored) {
        this.currentLocation = JSON.parse(stored);
      } else {
        // If no authenticated location, try to load guest location
        const guestLocation = localStorage.getItem('dleva_guest_delivery_location');
        if (guestLocation) {
          this.currentLocation = JSON.parse(guestLocation);
        }
      }

      const recent = localStorage.getItem(STORAGE_KEYS.RECENT_LOCATIONS);
      if (recent) {
        this.recentLocations = JSON.parse(recent);
      }

      const type = localStorage.getItem(STORAGE_KEYS.LOCATION_TYPE);
      if (type) {
        this.locationType = type;
      }
    } catch (error) {
      logError(error, { context: 'LocationManager.initFromStorage' });
    }
  }

  /**
   * Persist location to local storage
   */
  persistToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_LOCATION,
        JSON.stringify(this.currentLocation)
      );
      localStorage.setItem(
        STORAGE_KEYS.RECENT_LOCATIONS,
        JSON.stringify(this.recentLocations)
      );
      localStorage.setItem(STORAGE_KEYS.LOCATION_TYPE, this.locationType);
    } catch (error) {
      logError(error, { context: 'LocationManager.persistToStorage' });
    }
  }

  /**
   * Subscribe to location changes
   * @param {Function} callback
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of location change
   */
  notifyListeners(location) {
    this.listeners.forEach(callback => callback(location));
  }

  /**
   * Get current location
   */
  getCurrentLocation() {
    return this.currentLocation;
  }

  /**
   * Request GPS location
   * @returns {Promise} { latitude, longitude, accuracy, timestamp } or error
   */
  async requestGPSLocation() {
    if (!navigator.geolocation) {
      throw {
        error: 'Geolocation not supported',
        code: 'GEO_NOT_SUPPORTED',
      };
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      throw {
        error: 'Location access requires HTTPS in production',
        code: 'INSECURE_CONTEXT',
      };
    }

    const getPosition = (options) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            resolve({
              latitude: parseFloat(latitude.toFixed(8)),
              longitude: parseFloat(longitude.toFixed(8)),
              accuracy: Math.round(accuracy),
              timestamp: Date.now(),
              source: 'gps',
            });
          },
          (error) => {
            const errorMap = {
              1: { code: 'PERMISSION_DENIED', message: 'Location permission denied' },
              2: { code: 'POSITION_UNAVAILABLE', message: 'Position unavailable' },
              3: { code: 'TIMEOUT', message: 'Location request timed out' },
            };
            reject(errorMap[error.code] || { code: 'UNKNOWN_ERROR', message: error.message });
          },
          options
        );
      });

    try {
      // Try a faster coarse lookup first so mobile browsers can return a cached fix quickly.
      return await getPosition({
        timeout: GPS_CONFIG.QUICK_TIMEOUT,
        enableHighAccuracy: GPS_CONFIG.QUICK_HIGH_ACCURACY,
        maximumAge: GPS_CONFIG.MAX_AGE,
      });
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED') {
        throw error;
      }

      // Fall back to a slower precise lookup for devices that need more time to lock GPS.
      return getPosition({
        timeout: GPS_CONFIG.FALLBACK_TIMEOUT,
        enableHighAccuracy: GPS_CONFIG.ENABLE_HIGH_ACCURACY,
        maximumAge: 0,
      });
    }
  }

  /**
   * Watch GPS location (continuous updates)
   * @param {Function} callback
   * @returns {Function} unwatch function
   */
  watchGPSLocation(callback) {
    if (!navigator.geolocation) {
      callback(null, { code: 'GEO_NOT_SUPPORTED' });
      return () => {};
    }

    this.gpsWatcher = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        callback({
          latitude: parseFloat(latitude.toFixed(8)),
          longitude: parseFloat(longitude.toFixed(8)),
          accuracy: Math.round(accuracy),
          timestamp: Date.now(),
          source: 'gps',
        });
      },
      (error) => {
        callback(null, error);
      },
      {
        enableHighAccuracy: GPS_CONFIG.ENABLE_HIGH_ACCURACY,
        maximumAge: GPS_CONFIG.MAX_AGE,
      }
    );

    // Return unwatch function
    return () => {
      if (this.gpsWatcher !== null) {
        navigator.geolocation.clearWatch(this.gpsWatcher);
        this.gpsWatcher = null;
      }
    };
  }

  /**
   * Geocode address (address → coordinates)
   * @param {string} address
   * @returns {Promise}
   */
  async geocodeAddress(address) {
    try {
      const response = await api.post(API_ENDPOINTS.LOCATION.GEOCODE, {
        address,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'LocationManager.geocodeAddress', address });
      throw error;
    }
  }

  /**
   * Reverse geocode (coordinates → address)
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise}
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await api.post(API_ENDPOINTS.BUYER.ADDRESS_REVERSE_GEOCODE, {
        latitude,
        longitude,
      });
      return response.data.address || response.data;
    } catch (error) {
      logError(error, {
        context: 'LocationManager.reverseGeocode',
        latitude,
        longitude,
      });
      throw error;
    }
  }

  /**
   * Set location (from user input, GPS, or address search)
   * @param {Object} location { address, latitude, longitude, city, area }
   * @param {string} locationType buyer_delivery, buyer_home, rider_current
   */
  async setLocation(location, locationType = 'buyer_delivery') {
    try {
      // Ensure address is a string
      let addressToSend = location.address;
      if (typeof addressToSend === 'object' && addressToSend) {
        addressToSend = addressToSend.display_name || addressToSend.address || '';
      }

      // Save to backend
      const response = await api.post(API_ENDPOINTS.LOCATION.SAVE, {
        location_type: locationType,
        address: addressToSend,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        area: location.area,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to save location');
      }

      // Update local state
      this.currentLocation = {
        ...location,
        address: addressToSend,
        id: response.data.location.id,
        savedAt: Date.now(),
      };
      this.locationType = locationType;

      // Update recent locations
      this.addToRecentLocations(location);

      // Persist to storage
      this.persistToStorage();

      // Notify listeners
      this.notifyListeners(this.currentLocation);

      return response.data;
    } catch (error) {
      logError(error, { context: 'LocationManager.setLocation', location });
      throw error;
    }
  }

  /**
   * Add location to recent list
   * @param {Object} location
   */
  addToRecentLocations(location) {
    // Remove duplicate if exists
    this.recentLocations = this.recentLocations.filter(
      loc =>
        !(
          Math.abs(loc.latitude - location.latitude) < 0.0001 &&
          Math.abs(loc.longitude - location.longitude) < 0.0001
        )
    );

    // Add to front
    this.recentLocations.unshift({
      ...location,
      addedAt: Date.now(),
    });

    // Keep only last 10
    this.recentLocations = this.recentLocations.slice(0, 10);

    // Persist
    this.persistToStorage();
  }

  /**
   * Get recent locations
   * @returns {Array}
   */
  getRecentLocations() {
    return [...this.recentLocations];
  }

  /**
   * Clear location
   */
  clearLocation() {
    this.currentLocation = null;
    this.locationType = 'buyer_delivery';
    localStorage.removeItem(STORAGE_KEYS.CURRENT_LOCATION);
    localStorage.removeItem(STORAGE_KEYS.LOCATION_TYPE);
    this.notifyListeners(null);
  }

  /**
   * Estimate delivery fee
   * @param {Object} params
   * @returns {Promise}
   */
  async estimateDeliveryFee(pickupLoc, deliveryLoc) {
    try {
      const response = await api.post(
        API_ENDPOINTS.LOCATION.ESTIMATE_DELIVERY_FEE,
        {
          pickup_latitude: pickupLoc.latitude,
          pickup_longitude: pickupLoc.longitude,
          delivery_latitude: deliveryLoc.latitude,
          delivery_longitude: deliveryLoc.longitude,
        }
      );
      return response.data;
    } catch (error) {
      logError(error, {
        context: 'LocationManager.estimateDeliveryFee',
      });
      throw error;
    }
  }

  /**
   * Get nearby restaurants
   * @param {Object} location
   * @param {Object} options { radius, search, limit, offset }
   * @returns {Promise}
   */
  async getNearbyRestaurants(location, options = {}) {
    try {
      const params = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: options.radius || 15,
        limit: options.limit || 20,
        offset: options.offset || 0,
      };
      if (options.search) {
        params.search = options.search;
      }

      const response = await api.get(
        API_ENDPOINTS.LOCATION.GET_NEARBY_RESTAURANTS,
        { params }
      );
      return response.data;
    } catch (error) {
      logError(error, {
        context: 'LocationManager.getNearbyRestaurants',
      });
      throw error;
    }
  }

  /**
   * Calculate distance between two points (Haversine)
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} distance in km
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Validate location coordinates
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Object} { valid, error }
   */
  static validateCoordinates(latitude, longitude) {
    if (latitude < -90 || latitude > 90) {
      return { valid: false, error: 'Invalid latitude' };
    }
    if (longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Invalid longitude' };
    }
    return { valid: true };
  }
}

// Export singleton instance
export const locationManager = new LocationManager();

export default locationManager;
