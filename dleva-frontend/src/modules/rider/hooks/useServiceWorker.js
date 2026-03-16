/**
 * useServiceWorker Hook
 * Registers and manages service worker for PWA functionality
 */

import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [registration, setRegistration] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    } else {
      console.warn('Service Workers not supported');
      setIsReady(true);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered:', reg);
      setRegistration(reg);
      setIsReady(true);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New Service Worker available');
            setHasUpdate(true);
          }
        });
      });

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
      });
    } catch (error) {
      console.error('Failed to register Service Worker:', error);
      setIsReady(true);
    }
  };

  /**
   * Skip waiting - activate new service worker
   */
  const skipWaiting = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  /**
   * Check for updates
   */
  const checkForUpdates = async () => {
    if (registration) {
      try {
        await registration.update();
        console.log('✅ Checked for Service Worker updates');
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }
  };

  /**
   * Clear entire cache
   */
  const clearCache = async () => {
    if (registration?.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHE' });
      console.log('🗑️ Cache clear requested');
    }
  };

  /**
   * Get cache size
   */
  const getCacheSize = async () => {
    return new Promise((resolve) => {
      if (registration?.active) {
        const channel = new MessageChannel();
        registration.active.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [channel.port2]
        );

        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
      } else {
        resolve(null);
      }
    });
  };

  /**
   * Request notification permission
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
    return false;
  };

  return {
    registration,
    hasUpdate,
    isReady,
    skipWaiting,
    checkForUpdates,
    clearCache,
    getCacheSize,
    requestNotificationPermission,
  };
};

export default useServiceWorker;
