/**
 * useSellerPushNotifications Hook
 * Initializes Firebase Cloud Messaging for seller when authenticated
 */

import { useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import sellerPushNotifications from '../services/sellerPushNotifications';

export const useSellerPushNotifications = () => {
  const { token } = useAuth();

  useEffect(() => {
    console.debug('[useSellerPushNotifications] effect check', {
      hasToken: Boolean(token),
    });

    // ✅ Guard: Only initialize if seller token exists
    if (!token) {
      return;
    }

    // Check if seller_access_token exists (seller uses different token key)
    const sellerToken = localStorage.getItem('seller_access_token');
    if (!sellerToken) {
      return;
    }

    const initializePushNotifications = async () => {
      try {
        console.debug('[useSellerPushNotifications] starting push notifications init');

        // Register FCM token
        if (sellerPushNotifications && typeof sellerPushNotifications.initialize === 'function') {
          const initialized = await sellerPushNotifications.initialize();
          if (initialized) {
            console.info('[useSellerPushNotifications] push notifications initialized successfully');
          } else {
            console.warn('[useSellerPushNotifications] push notifications initialization returned false');
          }
        }
      } catch (error) {
        console.error('[useSellerPushNotifications] failed to initialize:', error);
      }
    };

    initializePushNotifications();
  }, [token]);
};

export default useSellerPushNotifications;
