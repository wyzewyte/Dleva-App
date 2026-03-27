/**
 * useLocationServices Hook
 * 
 * Unified location-dependent services with intelligent caching
 * - Restaurants near location
 * - Delivery fees (cached to avoid duplicate calculations)
 * - Location validation
 * 
 * This hook centralizes all API calls that depend on current location
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import useLocation from './useLocation';
import buyerRestaurants from '../services/buyerRestaurants';
import { estimateDeliveryFee } from '../services/deliveryService';
import { logError } from '../utils/errorHandler';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useLocationServices = () => {
  const { currentLocation } = useLocation();
  
  // Cache for restaurants and delivery fees
  const restaurantsCacheRef = useRef({ data: null, timestamp: null });
  const deliveryFeeCacheRef = useRef({}); // Map of vendorId -> { fee, timestamp }

  // State for operations
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState(null);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState({});
  const [deliveryFeeError, setDeliveryFeeError] = useState({});

  /**
   * Check if cache is still valid
   */
  const isCacheValid = useCallback((timestamp) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  /**
   * Validate location is set
   */
  const validateLocation = useCallback(() => {
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      throw new Error('Location not set');
    }
  }, [currentLocation]);

  /**
   * Get nearby restaurants with caching
   */
  const getNearbyRestaurants = useCallback(async (forceRefresh = false) => {
    try {
      validateLocation();

      // Check cache
      if (!forceRefresh && restaurantsCacheRef.current.data && isCacheValid(restaurantsCacheRef.current.timestamp)) {
        return restaurantsCacheRef.current.data;
      }

      setRestaurantsLoading(true);
      setRestaurantsError(null);

      const restaurants = await buyerRestaurants.listRestaurants(
        currentLocation.latitude,
        currentLocation.longitude
      );

      // Update cache
      restaurantsCacheRef.current = {
        data: restaurants,
        timestamp: Date.now(),
      };

      setRestaurantsLoading(false);
      return restaurants;
    } catch (error) {
      logError(error, { context: 'useLocationServices.getNearbyRestaurants' });
      setRestaurantsError(error.message || 'Failed to fetch restaurants');
      setRestaurantsLoading(false);
      throw error;
    }
  }, [currentLocation, validateLocation, isCacheValid]);

  /**
   * Get delivery fee with caching
   * Returns cached value if available and valid
   */
  const getDeliveryFee = useCallback(async (vendorId, forceRefresh = false) => {
    try {
      validateLocation();

      // Check cache first
      const cached = deliveryFeeCacheRef.current[vendorId];
      if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
        return cached.fee;
      }

      setDeliveryFeeLoading(prev => ({ ...prev, [vendorId]: true }));
      setDeliveryFeeError(prev => ({ ...prev, [vendorId]: null }));

      const result = await estimateDeliveryFee(
        vendorId,
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate delivery fee');
      }

      // Cache the result
      deliveryFeeCacheRef.current[vendorId] = {
        fee: result.deliveryFee,
        timestamp: Date.now(),
      };

      setDeliveryFeeLoading(prev => ({ ...prev, [vendorId]: false }));
      return result.deliveryFee;
    } catch (error) {
      logError(error, { context: 'useLocationServices.getDeliveryFee', vendorId });
      const errorMsg = error.message || 'Failed to calculate delivery fee';
      setDeliveryFeeError(prev => ({ ...prev, [vendorId]: errorMsg }));
      setDeliveryFeeLoading(prev => ({ ...prev, [vendorId]: false }));
      throw error;
    }
  }, [currentLocation, validateLocation, isCacheValid]);

  /**
   * Get delivery fees for multiple vendors
   */
  const getDeliveryFeesBatch = useCallback(async (vendorIds, forceRefresh = false) => {
    try {
      const fees = {};
      const promises = vendorIds.map(vendorId =>
        getDeliveryFee(vendorId, forceRefresh)
          .then(fee => { fees[vendorId] = fee; })
          .catch(() => { fees[vendorId] = null; })
      );

      await Promise.all(promises);
      return fees;
    } catch (error) {
      logError(error, { context: 'useLocationServices.getDeliveryFeesBatch' });
      throw error;
    }
  }, [getDeliveryFee]);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(() => {
    restaurantsCacheRef.current = { data: null, timestamp: null };
    deliveryFeeCacheRef.current = {};
  }, []);

  /**
   * Clear location-dependent caches when location changes
   */
  useEffect(() => {
    clearCache();
  }, [currentLocation, clearCache]);

  return {
    // Operations
    getNearbyRestaurants,
    getDeliveryFee,
    getDeliveryFeesBatch,
    validateLocation,
    clearCache,

    // Loading states
    restaurantsLoading,
    deliveryFeeLoading,

    // Error states
    restaurantsError,
    deliveryFeeError,

    // Location check
    hasLocation: !!(currentLocation?.latitude && currentLocation?.longitude),
  };
};

export default useLocationServices;
