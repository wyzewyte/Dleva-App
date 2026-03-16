/**
 * Seller Notifications Service
 * Handles fetching and managing seller notifications
 */

import api from './axios';

export const sellerNotificationsService = {
  /**
   * Get all seller notifications
   * @param {number} limit - Number of notifications to fetch (default: 20)
   * @returns {Promise} List of notifications
   */
  getNotifications: async (limit = 20) => {
    try {
      const response = await api.get('/seller/notifications/', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching seller notifications:', error);
      throw error;
    }
  },

  /**
   * Get only unread notifications
   * @returns {Promise} List of unread notifications
   */
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/seller/notifications/', {
        params: { unread_only: true }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   * @returns {Promise} Unread notification count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/seller/notifications/unread-count/');
      return response.data.unread_count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise} Success response
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.post(
        `/seller/notifications/${notificationId}/read/`
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} Success response
   */
  markAllAsRead: async () => {
    try {
      // Fetch all unread notifications first
      const { notifications } = await sellerNotificationsService.getUnreadNotifications();
      
      // Mark each as read
      const promises = notifications.map(notif => 
        sellerNotificationsService.markAsRead(notif.id)
      );
      
      await Promise.all(promises);
      return { message: 'All notifications marked as read' };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   * @param {number} notificationId - Notification ID
   * @returns {Promise} Success response
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/seller/notifications/${notificationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Update FCM token for push notifications
   * @param {string} fcmToken - Firebase Cloud Messaging token
   * @returns {Promise} Success response
   */
  updateFCMToken: async (fcmToken) => {
    try {
      const response = await api.post('/seller/update-fcm-token/', {
        fcm_token: fcmToken
      });
      return response.data;
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw error;
    }
  },

  /**
   * Filter notifications by type
   * @param {string} type - Notification type (new_order, order_cancelled, etc.)
   * @returns {Promise} Filtered notifications
   */
  getNotificationsByType: async (type) => {
    try {
      const response = await api.get('/seller/notifications/', {
        params: { type }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} notifications:`, error);
      throw error;
    }
  },

  /**
   * Get notification details
   * @param {number} notificationId - Notification ID
   * @returns {Promise} Notification details
   */
  getNotificationDetails: async (notificationId) => {
    try {
      const response = await api.get(`/seller/notifications/${notificationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification details:', error);
      throw error;
    }
  }
};

export default sellerNotificationsService;
