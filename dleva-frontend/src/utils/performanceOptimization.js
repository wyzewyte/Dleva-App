/**
 * Performance Optimization Utilities
 * Handles monitoring, analytics, and performance tracking
 */

import { analytics } from './analytics';
import { performanceMonitor } from './performanceMonitor';

export const initializePerformanceOptimization = () => {
  try {
    // Initialize performance monitoring
    performanceMonitor.initMonitoring();

    // Initialize analytics
    analytics.initialize();

    // Setup network interceptors for performance tracking
    setupNetworkInterceptors();

    console.log('✅ Performance optimization initialized');
  } catch (error) {
    console.error('Failed to initialize performance optimization:', error);
  }
};

const setupNetworkInterceptors = () => {
  // Track API performance
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const startTime = performance.now();
    
    try {
      const response = await originalFetch.apply(this, args);
      const duration = performance.now() - startTime;
      
      // Track slow requests (> 1000ms)
      if (duration > 1000) {
        analytics.trackEvent('slow_api_request', {
          url: args[0],
          duration: Math.round(duration),
          status: response.status
        });
      }
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      analytics.trackError('api_request_failed', {
        url: args[0],
        duration: Math.round(duration),
        error: error.message
      });
      throw error;
    }
  };
};

export default {
  initializePerformanceOptimization,
  setupNetworkInterceptors
};