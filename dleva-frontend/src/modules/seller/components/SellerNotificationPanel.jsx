import {
  Bell,
  CheckCheck,
  RefreshCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useSellerNotifications from '../../../hooks/useSellerNotifications';
import SellerNotificationCard from './SellerNotificationCard';
import {
  SellerEmptyState,
  SellerFeedbackState,
  SellerPrimaryButton,
  SellerQuietButton,
  SellerSecondaryButton,
  SellerStatusBadge,
} from './ui/SellerPrimitives';
import { SellerCard } from './ui/SellerPrimitives';

const SellerNotificationPanel = ({ limit, notificationsOverride, showFooterLink = false, className }) => {
  const { notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, isConnected } =
    useSellerNotifications();

  const sourceNotifications = notificationsOverride || notifications;
  const displayedNotifications = limit ? sourceNotifications.slice(0, limit) : sourceNotifications;

  if (loading && sourceNotifications.length === 0) {
    return <SellerFeedbackState type="loading" title="Loading notifications" message="Pulling your latest seller activity." className={className} />;
  }

  if (error && sourceNotifications.length === 0) {
    return (
      <SellerFeedbackState
        type="error"
        title="Could not load notifications"
        message={error}
        action={
          <SellerSecondaryButton onClick={fetchNotifications} icon={<RefreshCcw size={16} />}>
            Try Again
          </SellerSecondaryButton>
        }
        className={className}
      />
    );
  }

  if (displayedNotifications.length === 0) {
    return (
      <SellerEmptyState
        icon={<Bell size={24} />}
        title="No notifications yet"
        description="New orders, rider updates, reviews, and payout events will show up here."
        action={
          <SellerSecondaryButton onClick={fetchNotifications} icon={<RefreshCcw size={16} />}>
            Refresh
          </SellerSecondaryButton>
        }
        className={className}
      />
    );
  }

  return (
    <SellerCard className={className}>
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-dark">Notifications</h3>
            <SellerStatusBadge status={isConnected ? 'active' : 'inactive'}>
              {isConnected ? 'Live' : 'Syncing'}
            </SellerStatusBadge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'Everything is up to date.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
          <SellerQuietButton onClick={fetchNotifications} icon={<RefreshCcw size={16} />}>
            Refresh
          </SellerQuietButton>
          {unreadCount > 0 ? (
            <SellerSecondaryButton className="sm:w-auto" onClick={markAllAsRead} icon={<CheckCheck size={16} />}>
              Mark all read
            </SellerSecondaryButton>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {displayedNotifications.map((notification) => (
          <SellerNotificationCard
            key={notification.id}
            notification={notification}
            compact
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        ))}
      </div>

      {showFooterLink ? (
        <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
          <Link to="/seller/notifications" className="block">
            <SellerPrimaryButton className="sm:w-auto">View all notifications</SellerPrimaryButton>
          </Link>
        </div>
      ) : null}
    </SellerCard>
  );
};

export default SellerNotificationPanel;
