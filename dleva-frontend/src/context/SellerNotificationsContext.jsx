/**
 * Seller Notifications Context
 * Manages global state for seller notifications
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import sellerNotificationsService from '../services/sellerNotifications';

export const SellerNotificationsContext = createContext();

export function SellerNotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Fetch all notifications
   */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sellerNotificationsService.getNotifications(50);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await sellerNotificationsService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await sellerNotificationsService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Add new notification to state (real-time via WebSocket)
   */
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  /**
   * Remove notification
   */
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  /**
   * Connect to WebSocket for real-time notifications
   */
  const connectWebSocket = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken');
      const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsScheme}://${window.location.host}/ws/notifications-seller/?token=${token}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Seller notifications WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'send_notification') {
            console.log('🔔 New notification received:', data);
            
            const notification = {
              id: data.id || Date.now(),
              type: data.notification_type,
              title: data.title,
              message: data.message,
              data: data.data || {},
              is_read: false,
              created_at: new Date().toISOString()
            };
            
            addNotification(notification);
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.title, {
                body: data.message,
                icon: '/app-icon.png'
              });
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => connectWebSocket(), 5000);
      };

      setSocket(ws);
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [addNotification]);

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  /**
   * Fetch unread count periodically
   */
  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications();

    // Fetch unread count every 30 seconds
    const interval = setInterval(async () => {
      try {
        const count = await sellerNotificationsService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /**
   * Connect WebSocket on mount
   */
  useEffect(() => {
    connectWebSocket();
    requestNotificationPermission();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connectWebSocket, requestNotificationPermission]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    connectWebSocket,
    requestNotificationPermission
  };

  return (
    <SellerNotificationsContext.Provider value={value}>
      {children}
    </SellerNotificationsContext.Provider>
  );
}

export default SellerNotificationsContext;
