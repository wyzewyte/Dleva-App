/**
 * Address Search Service
 * Interacts with backend address validation and search endpoints
 * Provides address search, reverse geocoding, and validation
 */

import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';

class AddressSearchService {
  constructor() {
    this.cache = new Map();
    this.debounceTimers = new Map();
  }

  /**
   * Search for addresses by query
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async searchAddresses(query, limit = 5) {
    if (!query || query.length < 3) {
      return [];
    }

    // Check local cache first
    const cacheKey = `search_${query.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      console.log('✅ Address search cache hit:', query);
      return this.cache.get(cacheKey);
    }

    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ADDRESS_SEARCH, {
        params: {
          q: query,
          limit: limit,
        },
      });

      const results = response.data.results || [];

      // Cache results
      this.cache.set(cacheKey, results);

      console.log(`🔍 Found ${results.length} addresses for: ${query}`);
      return results;
    } catch (error) {
      console.error('❌ Address search error:', error);
      return [];
    }
  }

  /**
   * Search with debounce (for live search UI)
   * @param {string} query - Search query
   * @param {Function} callback - Called with results
   * @param {number} debounceMs - Debounce delay
   */
  debounceSearch(query, callback, debounceMs = 500) {
    const key = 'live_search';

    // Clear previous timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const results = await this.searchAddresses(query);
      callback(results);
    }, debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} latitude - GPS latitude
   * @param {number} longitude - GPS longitude
   * @returns {Promise<Object|null>}
   */
  async reverseGeocode(latitude, longitude) {
    if (!latitude || !longitude) {
      return null;
    }

    // Check cache
    const cacheKey = `reverse_${Math.round(latitude * 10000)}_${Math.round(longitude * 10000)}`;
    if (this.cache.has(cacheKey)) {
      console.log('✅ Reverse geocode cache hit');
      return this.cache.get(cacheKey);
    }

    try {
      const response = await api.post(API_ENDPOINTS.BUYER.ADDRESS_REVERSE_GEOCODE, {
        latitude,
        longitude,
      });

      const address = response.data.address || null;

      // Cache result
      if (address) {
        this.cache.set(cacheKey, address);
      }

      console.log('📍 Reverse geocoded:', address?.display_name);
      return address;
    } catch (error) {
      console.error('❌ Reverse geocode error:', error);
      return null;
    }
  }

  /**
   * Validate address and get coordinates
   * @param {string} address - Address to validate
   * @returns {Promise<{valid: boolean, data: Object|null}>}
   */
  async validateAddress(address) {
    if (!address || address.length < 5) {
      return { valid: false, data: null };
    }

    try {
      const response = await api.post(API_ENDPOINTS.BUYER.ADDRESS_VALIDATE, {
        address,
      });

      const data = response.data;

      if (data.valid) {
        console.log('✅ Address validated:', address);
        return { valid: true, data };
      } else {
        console.warn('⚠️ Address validation failed:', data.message);
        return { valid: false, data };
      }
    } catch (error) {
      console.error('❌ Address validation error:', error);
      return { valid: false, data: null };
    }
  }

  /**
   * Get coordinates from address
   * @param {string} address - Address string
   * @returns {Promise<{latitude: number, longitude: number}|null>}
   */
  async geocodeAddress(address) {
    const results = await this.searchAddresses(address, 1);
    if (results.length > 0) {
      const result = results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
      };
    }
    return null;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Address cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
const addressSearchService = new AddressSearchService();
export default addressSearchService;
