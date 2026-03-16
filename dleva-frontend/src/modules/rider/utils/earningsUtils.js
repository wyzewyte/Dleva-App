/**
 * Rider Earnings Utilities
 * Helper functions for calculating and formatting earnings
 */

/**
 * Format currency in Nigerian Naira
 */
export const formatCurrency = (amount) => {
  return `₦${parseFloat(amount).toLocaleString('en-NG', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
};

/**
 * Calculate total earnings including bonuses and deductions
 */
export const calculateTotalEarnings = (baseEarnings, bonuses = 0, deductions = 0) => {
  return baseEarnings + bonuses - deductions;
};

/**
 * Calculate delivery earnings based on distance and base rate
 */
export const calculateDeliveryEarnings = (distanceKm, baseRatePerKm = 150) => {
  return distanceKm * baseRatePerKm;
};

/**
 * Calculate rating-based bonus
 */
export const calculateRatingBonus = (averageRating, baseBonus = 500) => {
  if (averageRating >= 4.8) return baseBonus * 1.25; // 25% bonus for 4.8+ stars
  if (averageRating >= 4.5) return baseBonus;
  if (averageRating >= 4.0) return baseBonus * 0.75; // 25% reduction
  return 0;
};

/**
 * Calculate surge pricing multiplier
 */
export const calculateSurgeMultiplier = (demandLevel) => {
  // demandLevel: 'low' | 'medium' | 'high' | 'critical'
  const multipliers = {
    low: 1.0,
    medium: 1.1,
    high: 1.25,
    critical: 1.5,
  };
  return multipliers[demandLevel] || 1.0;
};

/**
 * Format time period for display
 */
export const formatTimePeriod = (totalMinutes) => {
  if (!totalMinutes) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/**
 * Calculate incentive for completion targets
 */
export const calculateCompletionIncentive = (ordersCompleted, targetOrders = 10) => {
  const incentivePerOrder = 100; // Base incentive per order
  if (ordersCompleted >= targetOrders) {
    return (targetOrders * incentivePerOrder) + ((ordersCompleted - targetOrders) * 50);
  }
  return ordersCompleted * incentivePerOrder;
};

/**
 * Get earnings breakdown
 */
export const getEarningsBreakdown = (earnings) => {
  return {
    deliveryFees: earnings.delivery_fees || 0,
    bonus: earnings.bonus || 0,
    incentives: earnings.incentives || 0,
    total: calculateTotalEarnings(
      earnings.delivery_fees || 0,
      (earnings.bonus || 0) + (earnings.incentives || 0),
      earnings.deductions || 0
    ),
    deductions: earnings.deductions || 0,
  };
};

/**
 * Format earnings data for chart display
 */
export const formatEarningsForChart = (dailyEarnings) => {
  return dailyEarnings.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
    earnings: day.total || 0,
    deliveries: day.deliveries_count || 0,
  }));
};

/**
 * Calculate daily average earnings
 */
export const calculateDailyAverage = (totalEarnings, daysActive) => {
  return daysActive > 0 ? totalEarnings / daysActive : 0;
};

/**
 * Get earnings status with color coding
 */
export const getEarningsStatus = (earnings) => {
  // 'excellent' | 'good' | 'average' | 'poor'
  if (earnings >= 10000) return { status: 'excellent', color: 'green' };
  if (earnings >= 5000) return { status: 'good', color: 'blue' };
  if (earnings >= 2000) return { status: 'average', color: 'yellow' };
  return { status: 'poor', color: 'red' };
};

/**
 * Calculate payout after deductions
 */
export const calculatePayout = (earnings, commission = 0.1) => {
  const deductions = earnings * commission;
  return {
    gross: earnings,
    deductions,
    net: earnings - deductions,
  };
};

export default {
  formatCurrency,
  calculateTotalEarnings,
  calculateDeliveryEarnings,
  calculateRatingBonus,
  calculateSurgeMultiplier,
  formatTimePeriod,
  calculateCompletionIncentive,
  getEarningsBreakdown,
  formatEarningsForChart,
  calculateDailyAverage,
  getEarningsStatus,
  calculatePayout,
};
