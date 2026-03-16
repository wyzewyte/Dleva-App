/**
 * Distance Calculator Utility
 * Single source of truth for distance calculations across frontend and backend
 * Uses Haversine formula - matches backend implementation
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 * 
 * Formula matches: dleva/rider/assignment_service.py::calculate_distance()
 * 
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Validate inputs
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number'
  ) {
    return 0;
  }
  
  // Convert to radians
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon2Rad = (lon2 * Math.PI) / 180;
  
  // Differences
  const dlat = lat2Rad - lat1Rad;
  const dlon = lon2Rad - lon1Rad;
  
  // Haversine formula
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2;
  
  const c = 2 * Math.asin(Math.sqrt(a));
  
  const distance = R * c;
  
  // Round to 2 decimal places (matches backend)
  return Math.round(distance * 100) / 100;
};

/**
 * Estimate delivery time based on distance and average speed
 * Rough estimate: assumes average speed during traffic
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} { minutes: number, estimate: string }
 */
export const estimateDeliveryTime = (distanceKm) => {
  if (!distanceKm || distanceKm < 0) {
    return { minutes: 0, estimate: '—' };
  }
  
  // Rough estimates based on distance
  // Assume average speed of 20 km/h (accounting for traffic, stops, etc.)
  let baseTime = (distanceKm / 20) * 60; // Convert to minutes
  
  // Add buffer time (5 minutes per 3 km for pickup, etc.)
  let bufferTime = Math.ceil(distanceKm / 3) * 5;
  
  const totalMinutes = Math.ceil(baseTime + bufferTime);
  
  // Format estimate
  let estimate = '';
  if (totalMinutes < 60) {
    estimate = `${totalMinutes} mins`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    estimate = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  return { minutes: totalMinutes, estimate };
};

/**
 * Get distance category
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Category: 'very_short', 'short', 'medium', 'long', 'very_long'
 */
export const getDistanceCategory = (distanceKm) => {
  if (distanceKm <= 1) return 'very_short';
  if (distanceKm <= 3) return 'short';
  if (distanceKm <= 6) return 'medium';
  if (distanceKm <= 10) return 'long';
  return 'very_long';
};

/**
 * Check if distance is within service area
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} maxDistance - Maximum service distance (default: 15 km)
 * @returns {boolean} True if within service area
 */
export const isWithinServiceArea = (distanceKm, maxDistance = 15) => {
  if (!distanceKm || distanceKm < 0) return false;
  return distanceKm <= maxDistance;
};

/**
 * Calculate multiple distances at once
 * Useful for comparing distances to multiple riders/restaurants
 * 
 * @param {number} sourceLat - Source latitude
 * @param {number} sourceLon - Source longitude
 * @param {array} destinations - Array of { lat, lon, id }
 * @returns {array} Array of { id, distance, category }
 */
export const calculateMultipleDistances = (sourceLat, sourceLon, destinations = []) => {
  if (!Array.isArray(destinations)) return [];
  
  return destinations
    .map(dest => ({
      id: dest.id,
      distance: calculateDistance(sourceLat, sourceLon, dest.lat, dest.lon),
      category: getDistanceCategory(
        calculateDistance(sourceLat, sourceLon, dest.lat, dest.lon)
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Find nearest destination
 * 
 * @param {number} sourceLat - Source latitude
 * @param {number} sourceLon - Source longitude
 * @param {array} destinations - Array of { lat, lon, id, name }
 * @returns {object} Nearest destination with distance
 */
export const findNearest = (sourceLat, sourceLon, destinations = []) => {
  if (!Array.isArray(destinations) || destinations.length === 0) {
    return null;
  }
  
  const sorted = calculateMultipleDistances(sourceLat, sourceLon, destinations);
  if (sorted.length === 0) return null;
  
  const nearest = sorted[0];
  const destination = destinations.find(d => d.id === nearest.id);
  
  return {
    ...destination,
    distance: nearest.distance,
    category: nearest.category,
  };
};

/**
 * Calculate route distance (sum of multiple segments)
 * Useful for calculating total delivery distance
 * 
 * @param {array} coordinates - Array of [lat, lon] pairs
 * @returns {number} Total distance in kilometers
 */
export const calculateRouteDistance = (coordinates = []) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lon1] = coordinates[i];
    const [lat2, lon2] = coordinates[i + 1];
    
    totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
  }
  
  return Math.round(totalDistance * 100) / 100;
};

export default {
  calculateDistance,
  estimateDeliveryTime,
  getDistanceCategory,
  isWithinServiceArea,
  calculateMultipleDistances,
  findNearest,
  calculateRouteDistance,
};
