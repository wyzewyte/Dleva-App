/**
 * useRealtimeInitializer Hook
 * Initializes all real-time features when rider app loads
 */

import { useEffect } from 'react';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderWebSocket from '../services/riderWebSocket';
import riderFCM from '../services/riderFCM';

export const useRealtimeInitializer = () => {
  const { rider, token, loading } = useRiderAuth();
  const riderId = rider?.id;

  useEffect(() => {
    // ✅ Guard: Don't initialize during auth loading or without token
    if (loading || !token || !riderId) {
      return;
    }

    const initializeRealtime = async () => {
      try {
        // Register FCM token
        if (riderFCM && typeof riderFCM.registerToken === 'function') {
          await riderFCM.registerToken();
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
