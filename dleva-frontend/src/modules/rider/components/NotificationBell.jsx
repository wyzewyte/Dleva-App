/**
 * Notification Bell Component
 * Displays unread notification count and opens notification center
 */

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useRiderAuth } from '../context/RiderAuthContext';
import NotificationCenter from './NotificationCenter';

const NotificationBell = () => {
  const { token } = useRiderAuth();
  const { unreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Don't render if not authenticated (prevents unnecessary API calls)
  if (!token) {
    return null;
  }

  // ✅ Mark all notifications as read when opening the dropdown
  const handleOpenDropdown = async () => {
    setIsOpen(true);
    // Automatically mark all as read when user opens the dropdown
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell size={20} className="text-gray-600" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div className="absolute right-0 top-16 w-96 max-w-full bg-white rounded-lg shadow-xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-dark">Notifications</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notification Center */}
            <div className="max-h-96 overflow-y-auto">
              <NotificationCenter compact onClose={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
