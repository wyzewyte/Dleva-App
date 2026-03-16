/**
 * GPS Permission Service
 * Handles browser geolocation permissions and status checks
 * Provides safe, permission-aware GPS access
 */

class GpsPermissionService {
  constructor() {
    this.permissionStatus = null;
    this.hasGeolocationSupport = !!navigator.geolocation;
    this.permissionChangeListeners = [];
  }

  /**
   * Check if browser supports geolocation
   * @returns {boolean}
   */
  isSupported() {
    return this.hasGeolocationSupport;
  }

  /**
   * Request GPS access from user
   * Only works in HTTPS or localhost
   * @returns {Promise<GeolocationPosition>}
   */
  requestAccess() {
    return new Promise((resolve, reject) => {
      if (!this.hasGeolocationSupport) {
        reject(new Error('Geolocation not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ GPS access granted:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          this.permissionStatus = 'granted';
          this._notifyListeners();
          resolve(position);
        },
        (error) => {
          console.warn('❌ GPS access denied or error:', error.code, error.message);
          
          if (error.code === 1) {
            this.permissionStatus = 'denied';
          } else if (error.code === 2) {
            this.permissionStatus = 'unavailable';
            reject(new Error('Location unavailable - try moving to a location with stronger GPS signal'));
          } else if (error.code === 3) {
            this.permissionStatus = 'timeout';
            reject(new Error('Location request timed out'));
          } else {
            this.permissionStatus = 'error';
          }
          
          this._notifyListeners();
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 0, // Don't use cached location
        }
      );
    });
  }

  /**
   * Watch user's position continuously (battery intensive)
   * Use liveLocationService wrapper instead for better control
   * @param {Function} onPosition - Callback with position
   * @param {Function} onError - Error callback
   * @returns {number} watchID for cleanup
   */
  watchPosition(onPosition, onError) {
    if (!this.hasGeolocationSupport) {
      console.error('Geolocation not supported');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.permissionStatus = 'granted';
        onPosition(position);
      },
      (error) => {
        console.warn('Watch position error:', error);
        if (error.code === 1) {
          this.permissionStatus = 'denied';
        }
        onError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return watchId;
  }

  /**
   * Stop watching position
   * @param {number} watchId
   */
  clearWatch(watchId) {
    if (watchId && typeof navigator.geolocation.clearWatch === 'function') {
      navigator.geolocation.clearWatch(watchId);
      console.log('Cleared GPS watch');
    }
  }

  /**
   * Check permission status using Permissions API
   * Browsers may not support this for geolocation
   * @returns {Promise<string>} 'granted', 'denied', 'prompt', or 'unknown'
   */
  async checkPermissionStatus() {
    try {
      if (!navigator.permissions) {
        console.warn('Permissions API not supported');
        return 'unknown';
      }

      const result = await navigator.permissions.query({ name: 'geolocation' });
      this.permissionStatus = result.state;
      
      // Listen for changes
      result.addEventListener('change', () => {
        this.permissionStatus = result.state;
        this._notifyListeners();
      });

      return result.state;
    } catch (error) {
      console.warn('Error checking permission:', error);
      return 'unknown';
    }
  }

  /**
   * Get current permission status
   * @returns {string|null}
   */
  getStatus() {
    return this.permissionStatus;
  }

  /**
   * Subscribe to permission status changes
   * @param {Function} callback
   */
  onPermissionChange(callback) {
    this.permissionChangeListeners.push(callback);
    return () => {
      this.permissionChangeListeners = this.permissionChangeListeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  /**
   * Notify all permission change listeners
   * @private
   */
  _notifyListeners() {
    this.permissionChangeListeners.forEach((callback) => {
      try {
        callback(this.permissionStatus);
      } catch (error) {
        console.error('Permission change listener error:', error);
      }
    });
  }

  /**
   * Check if HTTPS (required for geolocation except localhost)
   * @returns {boolean}
   */
  isSecureContext() {
    return window.isSecureContext;
  }

  /**
   * Get user-friendly permission status message
   * @returns {string}
   */
  getStatusMessage() {
    const messages = {
      granted: 'GPS access granted - Location sharing enabled',
      denied: 'GPS access denied - Please enable location in settings',
      unavailable: 'Location currently unavailable',
      timeout: 'Location request timed out',
      prompt: 'Ready to request GPS access',
      unknown: 'Permission status unknown',
    };
    return messages[this.permissionStatus] || 'Checking GPS access...';
  }
}

// Export singleton instance
const gpsPermissionService = new GpsPermissionService();
export default gpsPermissionService;
