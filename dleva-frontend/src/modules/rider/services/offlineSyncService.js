/**
 * Offline Sync Service
 * Handles syncing queued actions and cached data when connection is restored
 */

import api from '../../../services/axios';
import offlineQueue from '../utils/offlineQueue';
import offlineStorage from '../utils/offlineStorage';

class OfflineSyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
  }

  /**
   * Add listener for sync events
   */
  onSync(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners of sync status
   */
  notifySync(status, details = {}) {
    this.syncListeners.forEach(callback => {
      callback({ status, ...details });
    });
  }

  /**
   * Check if online
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Initialize sync service
   */
  init() {
    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    console.log('✅ Offline sync service initialized');
  }

  /**
   * Handle online event
   */
  async handleOnline() {
    console.log('🌐 Connection restored, syncing offline actions...');
    this.notifySync('connecting');
    
    try {
      await this.syncAll();
      this.notifySync('success', { message: 'All offline actions synced' });
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifySync('error', { message: 'Failed to sync offline actions' });
    }
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('📵 Connection lost, entering offline mode');
    this.notifySync('offline');
  }

  /**
   * Sync all pending actions
   */
  async syncAll() {
    if (this.isSyncing || !this.isOnline()) {
      return;
    }

    this.isSyncing = true;
    const pendingActions = offlineQueue.getPendingActions();

    console.log(`📤 Syncing ${pendingActions.length} offline actions`);

    for (const action of pendingActions) {
      try {
        await this.syncAction(action);
        offlineQueue.markAsSynced(action.id);
        this.notifySync('action_synced', { actionId: action.id });
      } catch (error) {
        // Retry logic
        const shouldRetry = offlineQueue.incrementRetry(action.id);
        if (!shouldRetry) {
          offlineQueue.markAsFailed(action.id);
          this.notifySync('action_failed', { actionId: action.id, error: error.message });
        }
        console.error(`Failed to sync action ${action.id}:`, error);
      }
    }

    this.isSyncing = false;
    this.notifySync('complete');
  }

  /**
   * Sync single action
   */
  async syncAction(action) {
    console.log(`⏳ Syncing: ${action.action}`, action);

    offlineQueue.updateStatus(action.id, 'syncing');

    let response;
    switch (action.method) {
      case 'POST':
        response = await api.post(action.endpoint, action.data);
        break;
      case 'PUT':
        response = await api.put(action.endpoint, action.data);
        break;
      case 'PATCH':
        response = await api.patch(action.endpoint, action.data);
        break;
      case 'GET':
        response = await api.get(action.endpoint);
        break;
      case 'DELETE':
        response = await api.delete(action.endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${action.method}`);
    }

    console.log(`✅ Synced: ${action.action}`, response);
    return response;
  }

  /**
   * Queue action for offline sync
   */
  async queueAction(action, endpoint, method = 'POST', data = null) {
    const actionId = offlineQueue.addAction(action, endpoint, method, data);
    
    // If online, sync immediately
    if (this.isOnline()) {
      try {
        const queuedAction = offlineQueue.queue.find(q => q.id === actionId);
        if (queuedAction) {
          await this.syncAction(queuedAction);
          offlineQueue.markAsSynced(actionId);
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }

    return actionId;
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      queueStats: offlineQueue.getStats(),
    };
  }

  /**
   * Clear offline queue
   */
  clearQueue() {
    offlineQueue.clear();
    console.log('✅ Offline queue cleared');
  }

  /**
   * Clear offline storage (IndexedDB)
   */
  async clearStorage() {
    await offlineStorage.clearAll();
    console.log('✅ Offline storage cleared');
  }

  /**
   * Get offline stats
   */
  async getStats() {
    const storageSize = await offlineStorage.getSize();
    return {
      queueStats: offlineQueue.getStats(),
      storageSize,
      isOnline: this.isOnline(),
    };
  }
}

export default new OfflineSyncService();
