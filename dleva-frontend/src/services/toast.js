/**
 * Toast Notification Service
 * Global notification system for real-time alerts
 */

class ToastService {
  constructor() {
    this.toasts = [];
    this.listeners = [];
    this.defaultOptions = {
      duration: 4000,
      type: 'info',
      position: 'top-right'
    };
  }

  /**
   * Subscribe to toast updates
   */
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  /**
   * Create and display toast
   */
  show(message, options = {}) {
    const toast = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type: options.type || this.defaultOptions.type,
      duration: options.duration ?? this.defaultOptions.duration,
      position: options.position || this.defaultOptions.position,
      timestamp: new Date(),
      dismissible: options.dismissible !== false,
    };

    this.toasts = [...this.toasts, toast];
    this.notifyListeners();

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
    }

    return toast.id;
  }

  /**
   * Success toast
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  /**
   * Error toast
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error', duration: options.duration ?? 6000 });
  }

  /**
   * Warning toast
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  /**
   * Info toast
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }

  /**
   * Loading toast (no auto-dismiss)
   */
  loading(message, options = {}) {
    return this.show(message, { ...options, type: 'loading', duration: 0 });
  }

  /**
   * Dismiss toast by ID
   */
  dismiss(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notifyListeners();
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    this.toasts = [];
    this.notifyListeners();
  }

  /**
   * Get all active toasts
   */
  getToasts() {
    return this.toasts;
  }

  /**
   * Update toast content
   */
  update(id, updates) {
    this.toasts = this.toasts.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    this.notifyListeners();
  }

  /**
   * Clear all toasts of a type
   */
  clearByType(type) {
    this.toasts = this.toasts.filter(t => t.type !== type);
    this.notifyListeners();
  }
}

// Export singleton instance
export default new ToastService();
