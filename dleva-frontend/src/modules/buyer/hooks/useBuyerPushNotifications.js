/**
 * useBuyerPushNotifications Hook
 * Initializes Firebase Cloud Messaging for buyer when app loads
 */

import { useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import buyerPushNotifications from '../services/buyerPushNotifications';

export const useBuyerPushNotifications = () => {
  const { token, loading } = useAuth();

  useEffect(() => {
    console.debug('[useBuyerPushNotifications] effect check', {
      loading,
      hasToken: Boolean(token),
    });

    // ✅ Guard: Don't initialize during auth loading or without token
    if (loading || !token) {
      return;
    }

    const initializePushNotifications = async () => {
      try {
        console.debug('[useBuyerPushNotifications] starting push notifications init');

        // Register FCM token
        if (buyerPushNotifications && typeof buyerPushNotifications.initialize === 'function') {
          const initialized = await buyerPushNotifications.initialize();
          if (initialized) {
            console.info('[useBuyerPushNotifications] push notifications initialized successfully');
          } else {
            console.warn('[useBuyerPushNotifications] push notifications initialization returned false');
          }
        }
      } catch (error) {
        console.error('[useBuyerPushNotifications] failed to initialize:', error);
      }
    };

    initializePushNotifications();
  }, [token, loading]);
};

export default useBuyerPushNotifications;
