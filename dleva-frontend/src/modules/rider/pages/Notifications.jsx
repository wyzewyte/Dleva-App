import { useEffect, useState } from 'react';
import { Bell, ChevronRight, Package, ShieldAlert, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import {
  RiderCard,
  RiderEmptyState,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
} from '../components/ui/RiderPrimitives';
import { formatNotificationTime } from '../utils/realtimeUtils';

const UNUSED_formatNotificationMessage = (notification) => {
  if (notification.type !== 'assignment') {
    return notification.message;
  }

  const rawMessage = String(notification.message || '').trim();

  if (!rawMessage) {
    return 'New delivery';
  }

  const cleaned = rawMessage.replace(/^new delivery:\s*/i, '');
  const restaurantName = cleaned.split(' - ')[0].split(' – ')[0].trim();

  return restaurantName ? `New delivery: ${restaurantName}` : 'New delivery';
};

const getCompactNotificationMessage = (notification) => {
  if (notification.type !== 'assignment') {
    return notification.message;
  }

  const rawMessage = String(notification.message || '').trim();

  if (!rawMessage) {
    return 'New delivery';
  }

  const cleaned = rawMessage.replace(/^new delivery:\s*/i, '');
  const separators = ['→', 'â†’', ' - ', ' – ', ',', '\n'];

  const restaurantName = separators.reduce((value, separator) => {
    const parts = String(value || '').split(separator);
    return parts[0]?.trim() || value;
  }, cleaned);

  return restaurantName ? `New delivery: ${restaurantName}` : 'New delivery';
};

const getNotificationVisual = (type) => {
  switch (type) {
    case 'assignment':
    case 'status_update':
    case 'pickup':
    case 'delivery':
      return {
        icon: <Package size={18} />,
        tone: 'bg-emerald-50 text-emerald-700',
      };
    case 'payout':
      return {
        icon: <Wallet size={18} />,
        tone: 'bg-[#FFF4EC] text-[#FF6B00]',
      };
    case 'dispute':
    case 'warning':
    case 'suspension':
      return {
        icon: <ShieldAlert size={18} />,
        tone: 'bg-amber-50 text-amber-700',
      };
    default:
      return {
        icon: <Bell size={18} />,
        tone: 'bg-gray-100 text-gray-700',
      };
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const { unreadCount, error, fetchNotificationHistory, markAllAsRead } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setLoading(true);
      const data = await fetchNotificationHistory({ limit: 50, offset: 0 });

      if (!isMounted) return;

      setItems(data.notifications || []);
      setLoading(false);

      if (unreadCount > 0) {
        markAllAsRead();
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [fetchNotificationHistory, markAllAsRead, unreadCount]);

  if (loading) {
    return (
      <RiderPageShell maxWidth="max-w-3xl">
        <RiderPageHeader
          title="Notifications"
          subtitle="Stay on top of order activity, payout updates, and important rider account messages."
          showBack
          sticky
        />

        <div className="space-y-4 py-6">
          {[1, 2, 3].map((item) => (
            <RiderCard key={item} className="p-3.5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-5 w-36 animate-pulse rounded-lg bg-gray-100" />
                    <div className="h-4 w-14 animate-pulse rounded bg-gray-100" />
                  </div>

                  <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
                </div>
              </div>
            </RiderCard>
          ))}
        </div>
      </RiderPageShell>
    );
  }

  return (
    <RiderPageShell maxWidth="max-w-3xl" contentClassName="space-y-5 pb-8 pt-1">
      <RiderPageHeader
        title="Notifications"
        subtitle="Stay on top of order activity, payout updates, and important rider account messages."
        showBack
        sticky
      />

      {error ? (
        <RiderFeedbackState type="error" title="Notifications unavailable" message={error} />
      ) : null}

      {!error ? (
        items.length > 0 ? (
          <div className="space-y-3">
            {items.map((notification) => {
              const visual = getNotificationVisual(notification.type);

              return (
                <RiderCard key={notification.id} className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.tone}`}>
                      {visual.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-dark">{notification.title}</h3>
                        <span className="shrink-0 text-[11px] font-medium text-muted">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>

                      {notification.message ? (
                        <p className="mt-0.5 text-sm leading-snug text-muted">
                          {getCompactNotificationMessage(notification)}
                        </p>
                      ) : null}

                      {notification.order_id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/rider/orders/${notification.order_id}`)}
                          className="mt-2 inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-dark transition-colors hover:bg-gray-100"
                        >
                          View order
                          <ChevronRight size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </RiderCard>
              );
            })}
          </div>
        ) : (
          <RiderEmptyState
            icon={<Bell size={24} />}
            title="No notifications yet"
            description="When the backend sends rider notifications, they will show up here in a clean timeline."
          />
        )
      ) : null}
    </RiderPageShell>
  );
};

export default Notifications;
