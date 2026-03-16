/**
 * Seller Notifications List Component
 * Displays all notifications in an organized list
 */

import React, { useEffect } from 'react';
import useSellerNotifications from '../../hooks/useSellerNotifications';
import './NotificationsList.css';

function NotificationsList({ limit = 20 }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useSellerNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return '🛍️';
      case 'order_ready':
        return '✅';
      case 'order_cancelled':
        return '❌';
      case 'delivery_assigned':
        return '🚚';
      case 'payout_approved':
        return '💰';
      case 'new_review':
        return '⭐';
      case 'order_update':
        return '📢';
      case 'system_alert':
        return '⚠️';
      default:
        return '📬';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_order':
        return '#4CAF50';
      case 'order_cancelled':
        return '#F44336';
      case 'delivery_assigned':
        return '#2196F3';
      case 'payout_approved':
        return '#FF9800';
      case 'new_review':
        return '#FFC107';
      case 'system_alert':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const displayedNotifications = limit
    ? notifications.slice(0, limit)
    : notifications;

  if (loading) {
    return (
      <div className="notifications-list loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-list error">
        <div className="error-message">
          <p>⚠️ Error loading notifications</p>
          <small>{error}</small>
        </div>
      </div>
    );
  }

  if (displayedNotifications.length === 0) {
    return (
      <div className="notifications-list empty">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No notifications yet</h3>
          <p>You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-list">
      {unreadCount > 0 && (
        <div className="notifications-header">
          <span className="unread-text">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
          <button 
            className="mark-all-read-btn"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        </div>
      )}

      <div className="notifications-container">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${
              notification.is_read ? 'read' : 'unread'
            }`}
          >
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>

            <div className="notification-content">
              <div className="notification-header">
                <h4 className="notification-title">
                  {notification.title}
                </h4>
                {!notification.is_read && (
                  <span className="unread-indicator"></span>
                )}
              </div>

              <p className="notification-message">
                {notification.message}
              </p>

              {notification.data && Object.keys(notification.data).length > 0 && (
                <div className="notification-data">
                  {notification.data.order_id && (
                    <span className="data-item">
                      Order #{notification.data.order_id}
                    </span>
                  )}
                  {notification.data.amount && (
                    <span className="data-item">
                      ₦{notification.data.amount}
                    </span>
                  )}
                </div>
              )}

              <div className="notification-footer">
                <span className="notification-time">
                  {formatTime(notification.created_at)}
                </span>

                {!notification.is_read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>

            <div
              className="notification-type-indicator"
              style={{ backgroundColor: getNotificationColor(notification.type) }}
              title={notification.type}
            ></div>
          </div>
        ))}
      </div>

      {notifications.length > limit && (
        <div className="notifications-footer">
          <a href="/seller/notifications">View all {notifications.length} notifications</a>
        </div>
      )}
    </div>
  );
}

export default NotificationsList;
