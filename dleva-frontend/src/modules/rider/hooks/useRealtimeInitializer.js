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

  useEffect(() => {
    // ✅ Guard: Don't initialize during auth loading or without token
    if (loading || !token || !rider) {
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
          riderWebSocket.connectNotifications(rider.id);
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
  }, [token, rider, loading]);
};

export default useRealtimeInitializer;
