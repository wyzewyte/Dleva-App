import { Bell, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSellerNotifications from '../../../hooks/useSellerNotifications';
import SellerNotificationCard from '../components/SellerNotificationCard';
import {
  SellerCard,
  SellerEmptyState,
  SellerFeedbackState,
  SellerPageHeader,
  SellerQuietButton,
} from '../components/ui/SellerPrimitives';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'delivery', label: 'Delivery' },
];

const NotificationFilterTabs = ({ tabs, value, onChange }) => (
  <div className="border-b border-gray-200">
    <div className="flex items-end">
    {tabs.map((tab) => {
      const isActive = tab.id === value;

      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 border-b px-2 py-3 text-center text-sm font-semibold leading-none transition-colors ${
            isActive
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-dark'
          }`}
        >
          <span>{tab.label}</span>
        </button>
      );
    })}
  </div>
  </div>
);

const matchesFilter = (notification, filter) => {
  if (filter === 'all') return true;
  if (filter === 'orders') return notification.type?.includes('order');
  if (filter === 'delivery') return notification.type === 'delivery_assigned';
  return true;
};

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
  } = useSellerNotifications();
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unreadNotifications = notifications.filter((notification) => !notification.is_read);

    unreadNotifications.forEach((notification) => {
      markAsRead(notification.id);
    });
  }, [markAsRead, notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      return matchesFilter(notification, filter);
    });
  }, [filter, notifications]);

  const handleDelete = async (notificationId) => {
    setDeletingId(notificationId);
    try {
      await deleteNotification(notificationId);
    } finally {
      setDeletingId(null);
    }
  };

  const tabs = FILTER_TABS;

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-6">
      <SellerPageHeader
        eyebrow="Seller inbox"
        title="Notifications"
        className="py-4 sm:py-5"
        action={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark transition-colors hover:bg-gray-50"
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        }
      />

      {error ? <SellerFeedbackState type="error" title="Notifications issue" message={error} /> : null}

      <div className="xl:hidden">
        <SellerCard className="overflow-hidden p-4">
          <NotificationFilterTabs tabs={tabs} value={filter} onChange={setFilter} />
        </SellerCard>
      </div>

      <div className="hidden xl:block">
        <SellerCard className="overflow-hidden p-5">
          <NotificationFilterTabs tabs={tabs} value={filter} onChange={setFilter} />
        </SellerCard>
      </div>

      {loading && notifications.length === 0 ? (
        <SellerFeedbackState type="loading" title="Loading notifications" message="Pulling your latest seller activity." />
      ) : filteredNotifications.length === 0 ? (
        <SellerEmptyState
          icon={<Bell size={24} />}
          title="No notifications found"
          description="Try another filter to find the update you need."
          action={
            <SellerQuietButton onClick={() => setFilter('all')} className="justify-center bg-[#f8faf9] text-dark hover:bg-gray-100">
              Show all notifications
            </SellerQuietButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <SellerNotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={handleDelete}
              deleting={deletingId === notification.id}
            />
          ))}
        </div>
      )}

      {filteredNotifications.length > 0 ? (
        <SellerCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-dark">Cleaner inbox workflow</p>
              <p className="mt-1 text-sm text-muted">
                Messages are marked as read automatically once this page opens, and deleting a card removes it immediately.
              </p>
            </div>
            <SellerQuietButton
              onClick={() => {
                if (filteredNotifications[0]) {
                  handleDelete(filteredNotifications[0].id);
                }
              }}
              icon={<Trash2 size={16} />}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Delete latest
            </SellerQuietButton>
          </div>
        </SellerCard>
      ) : null}
    </div>
  );
};

export default Notifications;
