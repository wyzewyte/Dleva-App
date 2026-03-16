/**
 * Live Location Tracking Service
 * Manages battery-efficient background GPS tracking during delivery
 * Handles periodic updates with configurable frequencies
 */

import gpsPermissionService from './gpsPermissionService';

class LiveLocationService {
  constructor() {
    this.isTracking = false;
    this.currentLocation = null;
    this.trackingStatus = 'idle'; // idle, requesting, tracking, paused, error
    this.orderId = null;
    this.updateInterval = null;
    this.watchId = null;

    // Configuration for different order statuses
    this.updateFrequency = {
      default: 15000, // 15 seconds
      assigned: 30000, // 30 seconds - rider assigned, less urgent
      picked_up: 10000, // 10 seconds - on the way, more frequent
      arrived_at_pickup: 15000, // 15 seconds - at restaurant
    };

    this.maxAccuracy = 100; // Ignore locations with accuracy > 100m
    this.listeners = [];
    this.errorListeners = [];
  }

  /**
   * Start tracking buyer location
   * @param {number} orderId - Order ID to track
   * @param {string} initialStatus - Initial order status
   * @returns {Promise<void>}
   */
  async startTracking(orderId, initialStatus = 'assigned') {
    if (this.isTracking) {
      console.warn('Already tracking location');
      return;
    }

    if (!gpsPermissionService.isSupported()) {
      this._notifyError(new Error('Geolocation not supported'));
      return;
    }

    try {
      this.orderId = orderId;
      this.isTracking = true;
      this.trackingStatus = 'requesting';
      this._notifyListeners('tracking_status', 'requesting');

      // Get initial position
      const position = await gpsPermissionService.requestAccess();
      this._handlePositionUpdate(position);

      // Set up periodic updates
      this._setupPeriodicUpdates(initialStatus);

      console.log('✅ Location tracking started for order', orderId);
      this.trackingStatus = 'tracking';
      this._notifyListeners('tracking_status', 'tracking');
    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      this.isTracking = false;
      this.trackingStatus = 'error';
      this._notifyListeners('tracking_status', 'error');
      this._notifyError(error);
    }
  }

  /**
   * Stop tracking location
   */
  stopTracking() {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    this.trackingStatus = 'idle';
    this.orderId = null;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.watchId) {
      gpsPermissionService.clearWatch(this.watchId);
      this.watchId = null;
    }

    this._notifyListeners('tracking_status', 'idle');
    console.log('📴 Location tracking stopped');
  }

  /**
   * Pause tracking (low battery mode)
   */
  pauseTracking() {
    if (!this.isTracking) return;
    this.trackingStatus = 'paused';
    this._notifyListeners('tracking_status', 'paused');
  }

  /**
   * Resume tracking
   */
  resumeTracking() {
    if (!this.isTracking) return;
    this.trackingStatus = 'tracking';
    this._notifyListeners('tracking_status', 'tracking');
  }

  /**
   * Update tracking frequency based on order status
   * @param {string} orderStatus - New order status
   */
  updateTrackingFrequency(orderStatus) {
    const freq = this.updateFrequency[orderStatus] || this.updateFrequency.default;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this._setupPeriodicUpdates(orderStatus);
    }

    console.log(`📍 Updated tracking frequency for status "${orderStatus}": ${freq}ms`);
  }

  /**
   * Get current location
   * @returns {Object|null}
   */
  getCurrentLocation() {
    return this.currentLocation;
  }

  /**
   * Get tracking status
   * @returns {string}
   */
  getStatus() {
    return this.trackingStatus;
  }

  /**
   * Subscribe to location updates
   * @param {Function} callback - Receives {latitude, longitude, accuracy, timestamp}
   * @returns {Function} Unsubscribe function
   */
  onLocationUpdate(callback) {
    this.listeners.push({ type: 'update', callback });
    return () => {
      this.listeners = this.listeners.filter((l) => l.callback !== callback);
    };
  }

  /**
   * Subscribe to tracking status changes
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onTrackingStatus(callback) {
    this.listeners.push({ type: 'status', callback });
    return () => {
      this.listeners = this.listeners.filter((l) => l.callback !== callback);
    };
  }

  /**
   * Subscribe to errors
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onError(callback) {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== callback);
    };
  }

  /**
   * Setup periodic location updates
   * @private
   */
  _setupPeriodicUpdates(initialStatus) {
    const freq = this.updateFrequency[initialStatus] || this.updateFrequency.default;

    this.updateInterval = setInterval(async () => {
      if (!this.isTracking || this.trackingStatus === 'paused') {
        return;
      }

      try {
        const position = await gpsPermissionService.requestAccess();
        this._handlePositionUpdate(position);
      } catch (error) {
        console.warn('Error getting location update:', error);
        this._notifyError(error);
      }
    }, freq);

    console.log(`⏱️ Periodic updates set to ${freq}ms`);
  }

  /**
   * Handle position update from geolocation API
   * @private
   */
  _handlePositionUpdate(position) {
    const { latitude, longitude, accuracy } = position.coords;

    // Validate accuracy
    if (accuracy > this.maxAccuracy) {
      console.warn(
        `⚠️ Poor GPS accuracy ${accuracy}m > ${this.maxAccuracy}m threshold`
      );
      return;
    }

    this.currentLocation = {
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `📍 Location updated: (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) ± ${accuracy.toFixed(1)}m`
    );

    // Send to server
    this._sendLocationToServer();

    // Notify listeners
    this._notifyListeners('update', this.currentLocation);
  }

  /**
   * Send location to backend
   * @private
   */
  async _sendLocationToServer() {
    if (!this.currentLocation) return;

    try {
      const response = await fetch('/api/buyer/gps/location/update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this._getCsrfToken(),
        },
        body: JSON.stringify({
          latitude: this.currentLocation.latitude,
          longitude: this.currentLocation.longitude,
          accuracy: this.currentLocation.accuracy,
          order_id: this.orderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Location sent to server:', data.status);
    } catch (error) {
      console.error('❌ Failed to send location to server:', error);
      this._notifyError(error);
    }
  }

  /**
   * Notify all listeners
   * @private
   */
  _notifyListeners(type, data) {
    this.listeners.forEach((listener) => {
      if (listener.type === type || listener.type === 'any') {
        try {
          listener.callback(data);
        } catch (error) {
          console.error('Listener error:', error);
        }
      }
    });
  }

  /**
   * Notify error listeners
   * @private
   */
  _notifyError(error) {
    this.errorListeners.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error listener error:', err);
      }
    });
  }

  /**
   * Get CSRF token from cookie
   * @private
   */
  _getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === `${name}=`) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue || '';
  }

  /**
   * Check if currently tracking
   * @returns {boolean}
   */
  isActive() {
    return this.isTracking && this.trackingStatus === 'tracking';
  }

  /**
   * Get tracking summary
   * @returns {Object}
   */
  getSummary() {
    return {
      isTracking: this.isTracking,
      status: this.trackingStatus,
      orderId: this.orderId,
      currentLocation: this.currentLocation,
      isSecure: gpsPermissionService.isSecureContext(),
      isSupported: gpsPermissionService.isSupported(),
    };
  }
}

// Export singleton instance
const liveLocationService = new LiveLocationService();
export default liveLocationService;
