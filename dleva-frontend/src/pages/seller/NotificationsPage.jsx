import { Bell, CheckCheck, Filter, RefreshCcw } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import useSellerNotifications from '../../hooks/useSellerNotifications';
import SellerNotificationPanel from '../../modules/seller/components/SellerNotificationPanel';
import {
  SellerCard,
  SellerPageHeader,
  SellerPrimaryButton,
  SellerQuietButton,
  SellerSearchField,
  SellerSegmentedTabs,
} from '../../modules/seller/components/ui/SellerPrimitives';

function NotificationsPage() {
  const { notifications, unreadCount, loading, fetchNotifications } = useSellerNotifications();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'All', badge: notifications.length },
    { id: 'unread', label: 'Unread', badge: unreadCount },
    { id: 'orders', label: 'Orders', badge: notifications.filter((item) => item.type?.includes('order')).length },
    { id: 'payouts', label: 'Payouts', badge: notifications.filter((item) => item.type === 'payout_approved').length },
  ];

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'unread'
            ? !notification.is_read
            : filter === 'orders'
              ? notification.type?.includes('order')
              : notification.type === 'payout_approved';

      const haystack = `${notification.title} ${notification.message}`.toLowerCase();
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;
      return matchesFilter && matchesQuery;
    });
  }, [filter, notifications, query]);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Seller inbox"
        title="Notifications"
        action={
          <div className="hidden sm:block">
            <SellerPrimaryButton className="sm:w-auto" onClick={fetchNotifications} loading={loading} icon={<RefreshCcw size={16} />}>
              Refresh
            </SellerPrimaryButton>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <SellerCard className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-dark">Stay on top of seller activity</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">Unread updates are surfaced first so urgent actions are easy to spot.</p>
            </div>
          </div>

          <div className="mt-5">
            <SellerSegmentedTabs tabs={tabs} value={filter} onChange={setFilter} />
          </div>

          <div className="mt-4">
            <SellerSearchField
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
              placeholder="Search notifications"
            />
          </div>

          <div className="mt-4 space-y-2">
            <SellerQuietButton icon={<Filter size={16} />}>Filter: {tabs.find((item) => item.id === filter)?.label}</SellerQuietButton>
              <SellerQuietButton icon={<CheckCheck size={16} />}>
                {filteredNotifications.length} matching update{filteredNotifications.length === 1 ? '' : 's'}
              </SellerQuietButton>
            </div>
          </SellerCard>

        <SellerNotificationPanel className="min-w-0" notificationsOverride={filteredNotifications} />
      </div>
    </div>
  );
}

export default NotificationsPage;
