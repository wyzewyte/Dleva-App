import api from './axios';

class PushNotificationsService {
  constructor({ storageKey, endpoint, firebaseConfig, vapidKey }) {
    this.storageKey = storageKey;
    this.endpoint = endpoint;
    this.firebaseConfig = firebaseConfig;
    this.vapidKey = vapidKey;
    this.messaging = null;
    this.firebaseApp = null;
  }

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  }

  getStoredToken() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.error('Failed to read stored push token:', error);
      return null;
    }
  }

  storeToken(token) {
    try {
      localStorage.setItem(this.storageKey, token);
    } catch (error) {
      console.error('Failed to store push token:', error);
    }
  }

  clearStoredToken() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear stored push token:', error);
    }
  }

  hasValidFirebaseConfig() {
    if (!this.firebaseConfig || !this.vapidKey) {
      return false;
    }

    const requiredConfigKeys = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ];

    return requiredConfigKeys.every((key) => Boolean(this.firebaseConfig[key]));
  }

  async getMessaging() {
    if (this.messaging) return this.messaging;

    if (!this.hasValidFirebaseConfig()) {
      console.warn('Firebase push notifications are not configured for this app');
      return null;
    }

    try {
      console.debug('[pushNotifications] importing firebase messaging modules', {
        storageKey: this.storageKey,
        endpoint: this.endpoint,
      });

      const [{ initializeApp }, { getMessaging, isSupported }] = await Promise.all([
        import('firebase/app'),
        import('firebase/messaging'),
      ]);

      const supported = await isSupported();
      if (!supported) {
        console.warn('Firebase messaging is not supported in this browser');
        return null;
      }

      this.firebaseApp = initializeApp(this.firebaseConfig, this.storageKey);
      this.messaging = getMessaging(this.firebaseApp);
      console.debug('[pushNotifications] firebase messaging initialized', {
        storageKey: this.storageKey,
      });
      return this.messaging;
    } catch (error) {
      console.error('Failed to initialize Firebase messaging:', error);
      return null;
    }
  }

  async getRegistration() {
    if (!('serviceWorker' in navigator)) return null;

    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) return existing;

    return navigator.serviceWorker.register('/sw.js');
  }

  async fetchFirebaseToken() {
    const messaging = await this.getMessaging();
    if (!messaging) return null;

    const { getToken } = await import('firebase/messaging');
    const serviceWorkerRegistration = await this.getRegistration();

    return getToken(messaging, {
      vapidKey: this.vapidKey,
      serviceWorkerRegistration,
    });
  }

  async syncToken(token, action = 'register') {
    if (!this.endpoint) {
      console.warn('No push-token endpoint configured');
      return false;
    }

    await api.post(this.endpoint, {
      fcm_token: token,
      action,
      device_type: /android|iphone|ipad|ipod/i.test(navigator.userAgent) ? 'mobile' : 'web',
      device_name: navigator.userAgent,
    });

    return true;
  }

  async initialize() {
    try {
      console.debug('[pushNotifications] initialize called', {
        storageKey: this.storageKey,
      });

      if (this.getPermissionStatus() !== 'granted') return false;

      const storedToken = this.getStoredToken();

      let token = null;
      try {
        token = await this.fetchFirebaseToken();
      } catch (error) {
        console.warn('[pushNotifications] failed to fetch a fresh Firebase token, falling back to stored token if available', {
          storageKey: this.storageKey,
          error,
        });
        token = storedToken;
      }

      if (!token) return false;

      if (storedToken === token) {
        await this.syncToken(token, 'register');
        return true;
      }

      await this.syncToken(token, 'register');
      this.storeToken(token);
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async enable() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;
      return await this.initialize();
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return false;
    }
  }

  async unregister() {
    try {
      const token = this.getStoredToken();
      if (!token) return true;

      await this.syncToken(token, 'unregister');
      this.clearStoredToken();
      return true;
    } catch (error) {
      console.error('Failed to unregister push notifications:', error);
      return false;
    }
  }
}

export const createPushNotificationsService = (config) => new PushNotificationsService(config);

export default PushNotificationsService;
