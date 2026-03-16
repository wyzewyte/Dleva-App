/**
 * Notification Center Component
 * Displays notifications with history and management options
 */

import { useState, useEffect } from 'react';
import { Check, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatNotificationTime, getNotificationIcon } from '../utils/realtimeUtils';

const NotificationCenter = ({ compact = false, onClose = null }) => {
  const {
    notifications,
    loading,
    error,
    fetchNotificationHistory,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('unread'); // 'unread' or 'history'
  const [deleting, setDeleting] = useState(null);

  // Fetch history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    const historyData = await fetchNotificationHistory();
    setHistory(historyData);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const displayNotifications = activeTab === 'unread' ? notifications : history;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 size={20} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="p-4 text-center">
        <AlertCircle size={20} className="text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'min-h-48' : 'min-h-screen bg-gray-50 p-4'}>
      {/* Tabs */}
      {!compact && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'unread'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            History
          </button>
        </div>
      )}

      {/* Mark All As Read Button */}
      {activeTab === 'unread' && notifications.length > 0 && (
        <div className="p-2 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            ✅ Notifications auto-marked as read when opened
          </p>
        </div>
      )}

      {/* Notifications List */}
      {displayNotifications.length > 0 ? (
        <div className="space-y-2">
          {displayNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-all ${
                activeTab === 'unread'
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-xl mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-dark text-sm">
                    {notification.title}
                  </h3>
                  {notification.body && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatNotificationTime(notification.created_at)}
                  </p>
                </div>

                {/* Actions */}
                {activeTab === 'unread' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1 text-primary hover:bg-blue-200 rounded transition-colors"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      disabled={deleting === notification.id}
                      className="p-1 text-red-500 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === notification.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">
            {activeTab === 'unread'
              ? 'No unread notifications'
              : 'No notification history'}
          </p>
        </div>
      )}

      {/* View All Button (Compact Mode) */}
      {compact && notifications.length > 0 && onClose && (
        <button
          onClick={() => {
            onClose?.();
            // Navigate to full notifications page if needed
          }}
          className="w-full p-3 text-center text-sm font-medium text-primary hover:bg-gray-50 border-t border-gray-100"
        >
          View all notifications
        </button>
      )}
    </div>
  );
};

export default NotificationCenter;
