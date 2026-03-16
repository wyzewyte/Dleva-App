/**
 * Seller Notifications Full Page Component
 * Displays all notifications with filtering and management options
 */

import React, { useState } from 'react';
import useSellerNotifications from '../../hooks/useSellerNotifications';
import './NotificationsPage.css';

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useSellerNotifications();

  const [filter, setFilter] = useState('all'); // all, unread, new_order, etc.
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest

  const notificationTypes = [
    { value: 'all', label: 'All Notifications', icon: '📬' },
    { value: 'unread', label: 'Unread', icon: '🔔', badge: unreadCount },
    { value: 'new_order', label: 'New Orders', icon: '🛍️' },
    { value: 'order_cancelled', label: 'Cancelled', icon: '❌' },
    { value: 'delivery_assigned', label: 'Deliveries', icon: '🚚' },
    { value: 'payout_approved', label: 'Payouts', icon: '💰' },
    { value: 'new_review', label: 'Reviews', icon: '⭐' },
  ];

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = notifications.filter(n => !n.is_read);
    } else if (filter !== 'all') {
      filtered = notifications.filter(n => n.type === filter);
    }

    if (sortBy === 'oldest') {
      return [...filtered].reverse();
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const filteredCount = filteredNotifications.length;

  const getNotificationIcon = (type) => {
    const icons = {
      'new_order': '🛍️',
      'order_ready': '✅',
      'order_cancelled': '❌',
      'delivery_assigned': '🚚',
      'payout_approved': '💰',
      'new_review': '⭐',
      'order_update': '📢',
      'system_alert': '⚠️',
    };
    return icons[type] || '📬';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'new_order': '#4CAF50',
      'order_cancelled': '#F44336',
      'delivery_assigned': '#2196F3',
      'payout_approved': '#FF9800',
      'new_review': '#FFC107',
      'system_alert': '#9C27B0',
    };
    return colors[type] || '#757575';
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
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-content">
          <h1>📬 Notifications</h1>
          <p>Manage and track all your restaurant notifications</p>
        </div>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read-btn primary"
            onClick={markAllAsRead}
          >
            Mark all {unreadCount} as read
          </button>
        )}
      </div>

      <div className="notifications-layout">
        {/* Sidebar - Filters */}
        <aside className="notifications-sidebar">
          <div className="filters-section">
            <h3>Filters</h3>
            <div className="filter-list">
              {notificationTypes.map(type => {
                const typeCount = type.value === 'all'
                  ? notifications.length
                  : type.value === 'unread'
                  ? unreadCount
                  : notifications.filter(n => n.type === type.value).length;

                return (
                  <button
                    key={type.value}
                    className={`filter-btn ${filter === type.value ? 'active' : ''}`}
                    onClick={() => setFilter(type.value)}
                  >
                    <span className="filter-icon">{type.icon}</span>
                    <span className="filter-label">{type.label}</span>
                    {typeCount > 0 && (
                      <span className="filter-count">{typeCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sort-section">
            <h3>Sort</h3>
            <div className="sort-list">
              {[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`sort-btn ${sortBy === option.value ? 'active' : ''}`}
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="refresh-section">
            <button 
              className="refresh-btn"
              onClick={fetchNotifications}
              disabled={loading}
            >
              {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </aside>

        {/* Main Content - Notifications List */}
        <main className="notifications-main">
          {/* Results Header */}
          <div className="results-header">
            <span className="results-count">
              {filteredCount} notification{filteredCount !== 1 ? 's' : ''} found
            </span>
            {filter !== 'all' && (
              <button
                className="clear-filter-btn"
                onClick={() => setFilter('all')}
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredCount === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No notifications</h3>
              <p>
                {filter === 'all'
                  ? "You don't have any notifications yet."
                  : `No ${notificationTypes.find(t => t.value === filter)?.label.toLowerCase()} notifications.`}
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}
                >
                  <div className="card-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="card-content">
                    <div className="card-header">
                      <h3 className="card-title">{notification.title}</h3>
                      {!notification.is_read && (
                        <span className="unread-badge">Unread</span>
                      )}
                    </div>

                    <p className="card-message">
                      {notification.message}
                    </p>

                    {notification.data && Object.keys(notification.data).length > 0 && (
                      <div className="card-data">
                        {notification.data.order_id && (
                          <div className="data-row">
                            <span className="data-label">Order ID:</span>
                            <span className="data-value">#{notification.data.order_id}</span>
                          </div>
                        )}
                        {notification.data.amount && (
                          <div className="data-row">
                            <span className="data-label">Amount:</span>
                            <span className="data-value">₦{notification.data.amount}</span>
                          </div>
                        )}
                        {notification.data.rider_name && (
                          <div className="data-row">
                            <span className="data-label">Rider:</span>
                            <span className="data-value">{notification.data.rider_name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="card-footer">
                      <span className="card-time">
                        {formatTime(notification.created_at)}
                      </span>
                      {!notification.is_read && (
                        <button
                          className="mark-read-link"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className="card-indicator"
                    style={{ backgroundColor: getNotificationColor(notification.type) }}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default NotificationsPage;
