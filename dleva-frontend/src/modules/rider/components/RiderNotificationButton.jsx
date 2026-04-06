import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useRiderAuth } from '../context/RiderAuthContext';

const RiderNotificationButton = () => {
  const navigate = useNavigate();
  const { token } = useRiderAuth();
  const { unreadCount } = useNotifications();

  if (!token) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/rider/notifications')}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-surface text-muted transition-colors hover:bg-gray-100 hover:text-dark"
      aria-label="Open notifications"
      title="Notifications"
    >
      <Bell size={18} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#FF6B00] px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </button>
  );
};

export default RiderNotificationButton;
