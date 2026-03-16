/**
 * Rider Location Utilities
 * Helper functions for GPS tracking and location management
 */

import api from '../../../services/axios';

/**
 * Track rider's current location
 * Updates location every 15 seconds during active delivery
 */
export const updateRiderLocation = async (latitude, longitude) => {
  try {
    const response = await api.post('/rider/location/update/', {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error) {
    console.error('Failed to update location:', error);
    throw {
      error: error.response?.data?.error || 'Failed to update location',
      status: error.response?.status,
    };
  }
};

/**
 * Start continuous location tracking
 * Returns interval ID for cleanup
 */
export const startLocationTracking = (onLocationUpdate, intervalMs = 15000) => {
  const trackLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationUpdate({ latitude, longitude });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  // Track immediately
  trackLocation();

  // Then track at intervals
  const intervalId = setInterval(trackLocation, intervalMs);

  return intervalId;
};

/**
 * Stop location tracking
 */
export const stopLocationTracking = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

/**
 * Get rider's current location with high accuracy
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Calculate distance between two coordinates (in km)
 * Using Haversine formula
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get estimated time to destination
 * Simple calculation based on distance and average speed
 */
export const getEstimatedTime = (distance, averageSpeedKmH = 30) => {
  const timeInHours = distance / averageSpeedKmH;
  const minutes = Math.round(timeInHours * 60);
  return minutes;
};

/**
 * Format location as human-readable string
 */
export const formatLocation = (latitude, longitude) => {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

export default {
  updateRiderLocation,
  startLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
  calculateDistance,
  getEstimatedTime,
  formatLocation,
};
