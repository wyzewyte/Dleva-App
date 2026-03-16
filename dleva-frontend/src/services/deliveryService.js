/**
 * Delivery Service
 * 
 * Centralized service for all delivery fee calculations
 * Calls backend API to ensure single source of truth
 */

import { getAPIUrl, API_ENDPOINTS } from '../constants/apiConfig';
import { formatDistance } from '../utils/formatters';
import { calculateDistance } from '../utils/distanceCalculator';
import { getFeeBreakdown } from '../constants/deliveryFeeTiers';
import { getErrorMessage, handleAPIError, logError } from '../utils/errorHandler';

/**
 * Estimate delivery fee based on restaurant and buyer location
 * 
 * @param {number} restaurantId - Restaurant ID
 * @param {number} buyerLat - Buyer latitude
 * @param {number} buyerLon - Buyer longitude
 * @returns {Promise} Response with delivery_fee, distance_km, rider_earning, platform_commission
 */
export const estimateDeliveryFee = async (restaurantId, buyerLat, buyerLon) => {
  try {
    const response = await fetch(getAPIUrl(API_ENDPOINTS.RIDER.ESTIMATE_FEE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        buyer_lat: buyerLat,
        buyer_lon: buyerLon,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      distance: data.distance_km,
      deliveryFee: data.delivery_fee,
      riderEarning: data.rider_earning,
      platformCommission: data.platform_commission,
    };
  } catch (error) {
    const errorMsg = getErrorMessage(error);
    logError(error, { context: 'estimateDeliveryFee' });
    return {
      success: false,
      error: errorMsg,
    };
  }
};

/**
 * Get delivery fee with retry logic
 * Useful for scenarios where API might be temporarily unavailable
 * 
 * @param {number} restaurantId - Restaurant ID
 * @param {number} buyerLat - Buyer latitude
 * @param {number} buyerLon - Buyer longitude
 * @param {number} maxRetries - Maximum retry attempts (default: 2)
 * @returns {Promise} Delivery fee data or error
 */
export const estimateDeliveryFeeWithRetry = async (restaurantId, buyerLat, buyerLon, maxRetries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await estimateDeliveryFee(restaurantId, buyerLat, buyerLon);
      if (result.success) {
        return result;
      }
      lastError = result.error;
    } catch (error) {
      lastError = getErrorMessage(error);
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
    }
  }

  return {
    success: false,
    error: lastError || 'Failed to estimate delivery fee',
  };
};

/**
 * Format delivery fee for display
 * Ensures consistent formatting across the application
 * 
 * @param {number} fee - Delivery fee amount
 * @returns {string} Formatted fee with currency symbol
 */
export const formatDeliveryFee = (fee) => {
  if (!fee && fee !== 0) return '₦0';
  return `₦${Number(fee).toLocaleString()}`;
};

/**
 * Get fee breakdown for detailed display
 * Shows fee, distance, rider earning, and platform commission
 * 
 * @param {number} distance - Distance in kilometers
 * @returns {object} Fee breakdown
 */
export const getFeeBreakdownForDistance = (distance) => {
  return getFeeBreakdown(distance);
};

/**
 * Calculate distance between two coordinates
 * Frontend fallback (primary: backend calculates via API)
 * 
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistanceFallback = (lat1, lon1, lat2, lon2) => {
  return calculateDistance(lat1, lon1, lat2, lon2);
};

/**
 * Format distance for display
 * 
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance
 */
export const formatDistanceValue = (km) => {
  return formatDistance(km);
};

export default {
  estimateDeliveryFee,
  estimateDeliveryFeeWithRetry,
  formatDeliveryFee,
  getFeeBreakdownForDistance,
  calculateDistanceFallback,
  formatDistanceValue,
};
