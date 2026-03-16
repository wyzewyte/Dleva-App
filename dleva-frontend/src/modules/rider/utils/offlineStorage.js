/**
 * Offline Storage Utility
 * Manages IndexedDB for caching data offline
 */

class OfflineStorage {
  constructor() {
    this.dbName = 'dleva_offline_db';
    this.version = 1;
    this.db = null;
    this.init();
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Deliveries store
        if (!db.objectStoreNames.contains('deliveries')) {
          const deliveriesStore = db.createObjectStore('deliveries', { keyPath: 'id' });
          deliveriesStore.createIndex('orderId', 'orderId', { unique: false });
          deliveriesStore.createIndex('status', 'status', { unique: false });
          deliveriesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Locations store (for GPS tracking)
        if (!db.objectStoreNames.contains('locations')) {
          const locationsStore = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
          locationsStore.createIndex('orderId', 'orderId', { unique: false });
          locationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Cache store (for API responses)
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'endpoint' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('✅ IndexedDB upgraded with stores');
      };
    });
  }

  /**
   * Save delivery data
   */
  async saveDelivery(delivery) {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['deliveries'], 'readwrite');
      const store = transaction.objectStore('deliveries');
      const request = store.put({
        ...delivery,
        timestamp: new Date().toISOString(),
      });

      request.onsuccess = () => {
        console.log('💾 Delivery saved to cache:', delivery.id);
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to save delivery:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get delivery data
   */
  async getDelivery(orderId) {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['deliveries'], 'readonly');
      const store = transaction.objectStore('deliveries');
      const index = store.index('orderId');
      const request = index.get(orderId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to get delivery:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save location update
   */
  async saveLocation(orderId, latitude, longitude, accuracy) {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      const request = store.add({
        orderId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString(),
      });

      request.onsuccess = () => {
        console.log('📍 Location saved to cache');
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to save location:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get pending locations for order
   */
  async getLocationsByOrder(orderId) {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['locations'], 'readonly');
      const store = transaction.objectStore('locations');
      const index = store.index('orderId');
      const request = index.getAll(orderId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get locations:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear locations for order (after syncing)
   */
  async clearLocationsByOrder(orderId) {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      const index = store.index('orderId');
      const request = index.openCursor(orderId);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(true);
        }
      };

      request.onerror = () => {
        console.error('Failed to clear locations:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save API response to cache
   */
  async cacheResponse(endpoint, data, ttl = 5 * 60 * 1000) {
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({
        endpoint,
        data,
        timestamp: Date.now(),
        ttl,
      });

      request.onsuccess = () => {
        console.log('🔖 Response cached:', endpoint);
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to cache response:', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Get cached response
   */
  async getCachedResponse(endpoint) {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(endpoint);

      request.onsuccess = () => {
        const cached = request.result;
        if (cached) {
          // Check if cache is still valid
          const age = Date.now() - cached.timestamp;
          if (age < cached.ttl) {
            resolve(cached.data);
            return;
          }
        }
        resolve(null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Clear old cache entries
   */
  async clearExpiredCache() {
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const now = Date.now();

      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const item = cursor.value;
          if (now - item.timestamp > item.ttl) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve(true);
        }
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  }

  /**
   * Get database size (approximate)
   */
  async getSize() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null;
    }

    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentage: Math.round((estimate.usage / estimate.quota) * 100),
    };
  }

  /**
   * Clear all data
   */
  async clearAll() {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['deliveries', 'locations', 'cache'], 'readwrite');

      transaction.objectStore('deliveries').clear();
      transaction.objectStore('locations').clear();
      transaction.objectStore('cache').clear();

      transaction.oncomplete = () => {
        console.log('🗑️ IndexedDB cleared');
        resolve(true);
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }
}

export default new OfflineStorage();
