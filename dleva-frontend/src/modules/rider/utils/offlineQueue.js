/**
 * Offline Queue Utility
 * Manages queued actions that need to be synced when connection is restored
 */

class OfflineQueue {
  constructor() {
    this.storageKey = 'dleva_offline_queue';
    this.queue = this.loadQueue();
  }

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      return [];
    }
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add action to queue
   */
  addAction(action, endpoint, method = 'POST', data = null) {
    const queueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      endpoint,
      method,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: 3,
      status: 'pending', // pending, syncing, completed, failed
    };

    this.queue.push(queueItem);
    this.saveQueue();

    console.log(`📝 Queued offline action: ${action}`, queueItem);
    return queueItem.id;
  }

  /**
   * Get all pending actions
   */
  getPendingActions() {
    return this.queue.filter(item => item.status === 'pending');
  }

  /**
   * Update action status
   */
  updateStatus(id, status) {
    const item = this.queue.find(q => q.id === id);
    if (item) {
      item.status = status;
      this.saveQueue();
    }
  }

  /**
   * Mark action as synced
   */
  markAsSynced(id) {
    this.updateStatus(id, 'completed');
    // Keep completed actions for 24 hours for audit trail
    setTimeout(() => {
      this.queue = this.queue.filter(q => q.id !== id);
      this.saveQueue();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Increment retry count
   */
  incrementRetry(id) {
    const item = this.queue.find(q => q.id === id);
    if (item) {
      item.retries++;
      this.saveQueue();
      return item.retries <= item.maxRetries;
    }
    return false;
  }

  /**
   * Mark action as failed
   */
  markAsFailed(id) {
    this.updateStatus(id, 'failed');
  }

  /**
   * Clear failed actions
   */
  clearFailed() {
    this.queue = this.queue.filter(q => q.status !== 'failed');
    this.saveQueue();
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(q => q.status === 'pending').length,
      syncing: this.queue.filter(q => q.status === 'syncing').length,
      completed: this.queue.filter(q => q.status === 'completed').length,
      failed: this.queue.filter(q => q.status === 'failed').length,
    };
  }

  /**
   * Clear entire queue
   */
  clear() {
    this.queue = [];
    localStorage.removeItem(this.storageKey);
  }
}

export default new OfflineQueue();
