/**
 * useNotifications Hook
 * Manages rider notifications, unread count, and marking as read
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { useRiderAuth } from '../context/RiderAuthContext';

export const useNotifications = () => {
  const { token, loading: authLoading } = useRiderAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch unread notifications
   */
  const fetchUnreadNotifications = useCallback(async () => {
    // ✅ Guard: Don't fetch if auth is loading or user is not authenticated
    if (authLoading || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD);
      const unreadNotifications = response.data.notifications || [];
      setNotifications(unreadNotifications);
      setUnreadCount(unreadNotifications.length);
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
  const fetchNotificationHistory = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.HISTORY);
      return response.data.notifications || [];
    } catch (err) {
      console.error('Failed to fetch notification history:', err);
      return [];
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      
      // Update local state
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  }, []);

  /**
   * Mark all notifications as read (via dedicated API endpoint)
   */
  const markAllAsRead = useCallback(async () => {
    if (notifications.length === 0) return true; // Nothing to mark
    
    try {
      // Call dedicated endpoint to mark all as read in one request
      await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      
      // Clear all notifications from local state
      setNotifications([]);
      setUnreadCount(0);
      
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
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // Fetch unread notifications on mount, only if auth is ready
  useEffect(() => {
    // ✅ Only fetch when auth is loaded and user has a token
    if (!authLoading && token) {
      fetchUnreadNotifications();
    }
  }, [token, authLoading, fetchUnreadNotifications]);

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