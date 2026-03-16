/**
 * Delivery Fee Constants
 * Single source of truth for delivery fee tiers and calculations
 * Matches: dleva/rider/assignment_service.py::calculate_delivery_fee()
 */

/**
 * Delivery fee tiers
 * Structure: distance range → base fee + extra per km
 */
export const DELIVERY_FEE_TIERS = {
  SHORT: {
    maxDistance: 3,
    baseFee: 500,
    extraPerKm: 0,
    label: 'Short Distance',
    description: 'Up to 3 km',
  },
  MEDIUM: {
    minDistance: 3,
    maxDistance: 6,
    baseFee: 600,
    extraPerKm: 100,
    label: 'Medium Distance',
    description: '3 to 6 km',
  },
  LONG: {
    minDistance: 6,
    baseFee: 1000,
    extraPerKm: 150,
    label: 'Long Distance',
    description: 'Above 6 km',
  },
};

/**
 * Calculate delivery fee based on distance
 * Matches backend calculation exactly
 * 
 * Rules:
 * - Distance ≤ 3 km → ₦500
 * - 3 < Distance ≤ 6 km → ₦600 + (distance - 3) × ₦100
 * - Distance > 6 km → ₦1,000 + (distance - 6) × ₦150
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Delivery fee in Naira
 */
export const calculateDeliveryFee = (distanceKm) => {
  const distance = Number(distanceKm);
  
  if (isNaN(distance) || distance < 0) {
    return 0;
  }
  
  if (distance <= 3) {
    return DELIVERY_FEE_TIERS.SHORT.baseFee;
  } else if (distance <= 6) {
    const extraKm = distance - 3;
    const extraFee = extraKm * DELIVERY_FEE_TIERS.MEDIUM.extraPerKm;
    return Math.round(DELIVERY_FEE_TIERS.MEDIUM.baseFee + extraFee);
  } else {
    const extraKm = distance - 6;
    const extraFee = extraKm * DELIVERY_FEE_TIERS.LONG.extraPerKm;
    return Math.round(DELIVERY_FEE_TIERS.LONG.baseFee + extraFee);
  }
};

/**
 * Calculate rider earning from delivery fee
 * Rider gets 60% of delivery fee
 * 
 * @param {number} deliveryFee - Delivery fee amount
 * @returns {number} Rider earning amount
 */
export const calculateRiderEarning = (deliveryFee) => {
  const fee = Number(deliveryFee);
  if (isNaN(fee) || fee < 0) return 0;
  
  const RIDER_PERCENTAGE = 0.60; // 60%
  const earning = fee * RIDER_PERCENTAGE;
  
  // Minimum earning: ₦250
  const MINIMUM_EARNING = 250;
  return Math.max(Math.round(earning), MINIMUM_EARNING);
};

/**
 * Calculate platform commission from delivery fee
 * Platform keeps 40% of delivery fee
 * 
 * @param {number} deliveryFee - Delivery fee amount
 * @returns {number} Platform commission amount
 */
export const calculatePlatformCommission = (deliveryFee) => {
  const fee = Number(deliveryFee);
  if (isNaN(fee) || fee < 0) return 0;
  
  const riderEarning = calculateRiderEarning(fee);
  return Math.round(fee - riderEarning);
};

/**
 * Get fee tier for distance
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} Fee tier object
 */
export const getFeeTier = (distanceKm) => {
  const distance = Number(distanceKm);
  
  if (isNaN(distance) || distance < 0) {
    return DELIVERY_FEE_TIERS.SHORT;
  }
  
  if (distance <= 3) {
    return DELIVERY_FEE_TIERS.SHORT;
  } else if (distance <= 6) {
    return DELIVERY_FEE_TIERS.MEDIUM;
  } else {
    return DELIVERY_FEE_TIERS.LONG;
  }
};

/**
 * Get fee breakdown for display
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} Breakdown with fee, rider earning, platform commission
 */
export const getFeeBreakdown = (distanceKm) => {
  const distance = Number(distanceKm);
  
  if (isNaN(distance) || distance < 0) {
    return {
      distance: 0,
      deliveryFee: 0,
      riderEarning: 0,
      platformCommission: 0,
    };
  }
  
  const deliveryFee = calculateDeliveryFee(distance);
  const riderEarning = calculateRiderEarning(deliveryFee);
  const platformCommission = calculatePlatformCommission(deliveryFee);
  
  return {
    distance: Math.round(distance * 100) / 100,
    deliveryFee,
    riderEarning,
    platformCommission,
  };
};

/**
 * Check if delivery area is within service
 * Maximum service distance
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} maxDistance - Maximum service distance (default: 15 km)
 * @returns {boolean} True if within service area
 */
export const isWithinServiceArea = (distanceKm, maxDistance = 15) => {
  const distance = Number(distanceKm);
  
  if (isNaN(distance) || distance < 0) {
    return false;
  }
  
  return distance <= maxDistance;
};

/**
 * Get fee estimate for distance range
 * Shows minimum and maximum fee for a range
 * 
 * @param {number} minDistance - Minimum distance
 * @param {number} maxDistance - Maximum distance
 * @returns {object} Min and max fee estimate
 */
export const getEstimateRange = (minDistance, maxDistance) => {
  const minFee = calculateDeliveryFee(Number(minDistance) || 0);
  const maxFee = calculateDeliveryFee(Number(maxDistance) || 0);
  
  return {
    minFee: Math.min(minFee, maxFee),
    maxFee: Math.max(minFee, maxFee),
    range: `₦${Math.min(minFee, maxFee).toLocaleString()} - ₦${Math.max(minFee, maxFee).toLocaleString()}`,
  };
};

/**
 * Validate delivery fee
 * Ensures fee is within reasonable range
 * 
 * @param {number} fee - Fee to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateDeliveryFee = (fee) => {
  const feeNum = Number(fee);
  
  if (isNaN(feeNum)) {
    return { isValid: false, error: 'Invalid fee amount' };
  }
  
  if (feeNum < 100) {
    return { isValid: false, error: 'Fee must be at least ₦100' };
  }
  
  if (feeNum > 50000) {
    return { isValid: false, error: 'Fee exceeds maximum limit' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Constants for rider payout calculation
 */
export const PAYOUT_CONFIG = {
  RIDER_PERCENTAGE: 0.60, // 60% to rider
  PLATFORM_PERCENTAGE: 0.40, // 40% to platform
  MINIMUM_RIDER_EARNING: 250,
  MAXIMUM_DISTANCE: 15, // km
  MAXIMUM_FEE: 50000, // Naira
  MINIMUM_FEE: 100, // Naira
};

export default {
  DELIVERY_FEE_TIERS,
  PAYOUT_CONFIG,
  calculateDeliveryFee,
  calculateRiderEarning,
  calculatePlatformCommission,
  getFeeTier,
  getFeeBreakdown,
  isWithinServiceArea,
  getEstimateRange,
  validateDeliveryFee,
};
