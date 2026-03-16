/**
 * FCM Token Service
 * Handles Firebase Cloud Messaging token registration for push notifications
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

class FCMTokenService {
  constructor() {
    this.tokenStorageKey = 'rider_fcm_token';
  }

  /**
   * Check if Notification API is supported
   */
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    try {
      if (!this.isSupported()) {
        console.warn('Notifications not supported');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }

      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Get stored FCM token
   */
  getStoredToken() {
    try {
      return localStorage.getItem(this.tokenStorageKey);
    } catch (error) {
      console.error('Failed to get stored FCM token:', error);
      return null;
    }
  }

  /**
   * Store FCM token locally
   */
  storeToken(token) {
    try {
      localStorage.setItem(this.tokenStorageKey, token);
    } catch (error) {
      console.error('Failed to store FCM token:', error);
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(token) {
    try {
      if (!token) {
        console.warn('No FCM token to register');
        return false;
      }

      const response = await api.post(API_ENDPOINTS.REALTIME.REGISTER_FCM_TOKEN, {
        fcm_token: token,
        device_type: this.getDeviceType(),
        device_name: navigator.userAgent,
      });

      // Store token locally
      this.storeToken(token);

      console.log('✅ FCM token registered successfully');
      return true;
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      return false;
    }
  }

  /**
   * Unregister FCM token
   */
  async unregisterToken() {
    try {
      const token = this.getStoredToken();
      if (!token) return true;

      await api.post(API_ENDPOINTS.REALTIME.REGISTER_FCM_TOKEN, {
        fcm_token: token,
        action: 'unregister',
      });

      // Remove stored token
      localStorage.removeItem(this.tokenStorageKey);

      console.log('✅ FCM token unregistered');
      return true;
    } catch (error) {
      console.error('Failed to unregister FCM token:', error);
      return false;
    }
  }

  /**
   * Get device type
   */
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    return 'web';
  }

  /**
   * Initialize push notifications
   */
  async initialize() {
    try {
      if (!this.isSupported()) {
        console.warn('Push notifications not supported on this device');
        return false;
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return false;
      }

      // Check if already registered
      const storedToken = this.getStoredToken();
      if (storedToken) {
        console.log('✅ FCM token already registered');
        return true;
      }

      // Generate and register new token
      const token = this.generateToken();
      return await this.registerToken(token);
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Generate a simple FCM token (in production, use Firebase SDK)
   */
  generateToken() {
    // In production, this should come from Firebase Cloud Messaging
    // For now, generate a unique identifier
    return `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle incoming push notification
   */
  handlePushNotification(event) {
    const { title, body, icon, badge, tag, data } = event.data.json();

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
        badge,
        tag,
        data,
      })
    );
  }
}

export default new FCMTokenService();
