/**
 * Seller Notification Bell Icon Component
 * Displays notification count badge and handles click
 */

import React, { useState } from 'react';
import useSellerNotifications from '../../hooks/useSellerNotifications';
import NotificationsList from './NotificationsList';
import './NotificationBell.css';

function NotificationBell({ onNotificationClick }) {
  const { unreadCount, isConnected } = useSellerNotifications();
  const [showPopover, setShowPopover] = useState(false);

  const handleClick = () => {
    setShowPopover(!showPopover);
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell"
        onClick={handleClick}
        title={isConnected ? 'Notifications connected' : 'Notifications connecting...'}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {!isConnected && (
          <span className="connection-indicator disconnected" title="Disconnected" />
        )}

        {isConnected && (
          <span className="connection-indicator connected" title="Connected" />
        )}
      </button>

      {showPopover && (
        <div className="notification-popover">
          <div className="popover-header">
            <h3>Notifications</h3>
            <button
              className="close-btn"
              onClick={() => setShowPopover(false)}
            >
              ✕
            </button>
          </div>
          <div className="popover-content">
            <NotificationsList limit={10} />
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
