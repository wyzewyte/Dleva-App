/**
 * useRealtimeInitializer Hook
 * Initializes all real-time features when rider app loads
 */

import { useEffect } from 'react';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderWebSocket from '../services/riderWebSocket';
import riderPushNotifications from '../services/riderPushNotifications';

export const useRealtimeInitializer = () => {
  const { rider, token, loading } = useRiderAuth();
  const riderId = rider?.id;

  useEffect(() => {
    console.debug('[useRealtimeInitializer] effect check', {
      loading,
      hasToken: Boolean(token),
      riderId,
    });

    // ✅ Guard: Don't initialize during auth loading or without token
    if (loading || !token || !riderId) {
      return;
    }

    const initializeRealtime = async () => {
      try {
        console.debug('[useRealtimeInitializer] starting realtime init', {
          riderId,
        });

        // Register FCM token
        if (riderPushNotifications && typeof riderPushNotifications.initialize === 'function') {
          await riderPushNotifications.initialize();
        }

        // Initialize WebSocket for rider notifications (not order status)
        if (riderWebSocket && typeof riderWebSocket.connectNotifications === 'function') {
          riderWebSocket.connectNotifications(riderId);
        }
      } catch (error) {
        console.error('Failed to initialize real-time features:', error);
      }
    };

    initializeRealtime();

    return () => {
      if (riderWebSocket && typeof riderWebSocket.disconnect === 'function') {
        riderWebSocket.disconnect();
      }
    };
  }, [token, riderId, loading]);
};

export default useRealtimeInitializer;
