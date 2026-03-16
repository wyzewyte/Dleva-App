/**
 * Rider Location Service
 * Handles location updates and tracking for riders
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

class RiderLocationService {
  constructor() {
    this.watchId = null;
    this.updateInterval = 30000; // Update every 30 seconds
  }

  /**
   * Update rider location on backend
   * @param {number} latitude - Current latitude
   * @param {number} longitude - Current longitude
   * @param {number} accuracy - GPS accuracy in meters
   * @returns {Promise<Object>} Response from backend
   */
  async updateLocation(latitude, longitude, accuracy = 0) {
    try {
      // Validate inputs
      if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        throw new Error(`Invalid coordinates: latitude=${latitude}, longitude=${longitude}`);
      }

      const payload = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: Number(accuracy)
      };

      console.log('📍 Sending location to backend:', payload);

      // Note: Backend may expect this at /rider/profile/update-location/
      const response = await api.post(
        API_ENDPOINTS.RIDER.UPDATE_PROFILE_LOCATION,
        payload
      );
      console.log('✅ Location updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update location:', error);
      if (error.response?.data) {
        console.error('Backend error response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Start watching location and auto-update backend
   * @param {Function} onLocationChange - Callback when location changes
   * @param {Function} onError - Callback for errors
   */
  startTracking(onLocationChange, onError) {
    if (!navigator.geolocation) {
      const err = { message: 'Geolocation is not supported by your browser' };
      if (onError) onError(err);
      return;
    }

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          // Update backend
          const result = await this.updateLocation(latitude, longitude, accuracy);

          // Notify listener
          if (onLocationChange) {
            onLocationChange({
              latitude,
              longitude,
              accuracy,
              timestamp: new Date()
            });
          }
        } catch (err) {
          console.error('Location update error:', err);
          if (onError) onError(err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (onError) onError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Stop watching location
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get current location once
   * @returns {Promise<Object>} Location coordinates
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({ message: 'Geolocation not supported' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({ latitude, longitude, accuracy });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
}

export default new RiderLocationService();
