/**
 * useNotifications Hook
 * Manages rider notifications, unread count, and marking as read
 */

import * as React from 'react';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { useRiderAuth } from '../context/RiderAuthContext';

const NOTIFICATION_SYNC_EVENT = 'rider-notifications:refresh';

const normalizeNotification = (notification) => ({
  ...notification,
  body: notification?.body ?? notification?.message ?? '',
  message: notification?.message ?? notification?.body ?? '',
});

export const useNotifications = () => {
  const { token, loading: authLoading } = useRiderAuth();
  if (typeof window !== 'undefined') {
    console.debug('[useNotifications] hook invoked', {
      reactVersion: React.version,
      sameReactAsBootstrap: window.__DLEVA_REACT__ === React,
      hasToken: Boolean(token),
      authLoading,
    });
  }

  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  /**
   * Fetch unread notifications
   */
  const fetchUnreadNotifications = React.useCallback(async () => {
    // ✅ Guard: Don't fetch if auth is loading or user is not authenticated
    if (authLoading || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD);
      const unreadNotifications = (response.data.notifications || []).map(normalizeNotification);
      setNotifications(unreadNotifications);
      setUnreadCount(response.data.unread_count ?? unreadNotifications.length);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [token, authLoading]);

  /**
   * Fetch notification history
   */
  const fetchNotificationHistory = React.useCallback(async ({ limit = 20, offset = 0 } = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.HISTORY, {
        params: { limit, offset },
      });
      return {
        count: response.data.count ?? 0,
        notifications: (response.data.notifications || []).map(normalizeNotification),
      };
    } catch (err) {
      console.error('Failed to fetch notification history:', err);
      return {
        count: 0,
        notifications: [],
      };
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = React.useCallback(async (notificationId) => {
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      
      // Update local state
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent(NOTIFICATION_SYNC_EVENT));
      
      return true;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  }, []);

  /**
   * Mark all notifications as read (via dedicated API endpoint)
   */
  const markAllAsRead = React.useCallback(async () => {
    if (notifications.length === 0) return true; // Nothing to mark
    
    try {
      // Call dedicated endpoint to mark all as read in one request
      await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      
      // Clear all notifications from local state
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent(NOTIFICATION_SYNC_EVENT));
      
      return true;
    } catch (err) {
      // Fallback: try marking them individually if bulk endpoint fails
      console.warn('Bulk mark failed, trying individual marks:', err);
      try {
        const markReadPromises = notifications.map(n => 
          markAsRead(n.id)
        );
        await Promise.all(markReadPromises);
        return true;
      } catch (fallbackErr) {
        console.error('Failed to mark all as read:', fallbackErr);
        return false;
      }
    }
  }, [notifications, markAsRead]);

  /**
   * Add new notification to local state
   */
  const addNotification = React.useCallback((notification) => {
    setNotifications(prev => [normalizeNotification(notification), ...prev]);
    setUnreadCount(prev => prev + 1);
    window.dispatchEvent(new CustomEvent(NOTIFICATION_SYNC_EVENT));
  }, []);

  // Fetch unread notifications on mount, only if auth is ready
  React.useEffect(() => {
    // ✅ Only fetch when auth is loaded and user has a token
    if (!authLoading && token) {
      fetchUnreadNotifications();
    }
  }, [token, authLoading, fetchUnreadNotifications]);

  React.useEffect(() => {
    if (!token) return undefined;

    const handleSync = () => {
      fetchUnreadNotifications();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadNotifications();
      }
    };

    window.addEventListener(NOTIFICATION_SYNC_EVENT, handleSync);
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener(NOTIFICATION_SYNC_EVENT, handleSync);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [token, fetchUnreadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchUnreadNotifications,
    fetchNotificationHistory,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
};

export default useNotifications;
