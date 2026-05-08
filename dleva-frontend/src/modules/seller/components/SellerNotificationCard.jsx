import { Bell, CircleAlert, CreditCard, PackageCheck, ShieldAlert, ShoppingBag, Star, Trash2, Truck } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { Link } from 'react-router-dom';
import { SellerQuietButton, SellerStatusBadge } from './ui/SellerPrimitives';
import { cn } from '../../../utils/cn';

const notificationMeta = {
  new_order: { label: 'New order', icon: ShoppingBag, tone: 'text-emerald-600 bg-emerald-50', accent: 'border-emerald-100' },
  order_ready: { label: 'Order ready', icon: PackageCheck, tone: 'text-sky-600 bg-sky-50', accent: 'border-sky-100' },
  order_cancelled: { label: 'Cancelled', icon: CircleAlert, tone: 'text-red-600 bg-red-50', accent: 'border-red-100' },
  delivery_assigned: { label: 'Delivery', icon: Truck, tone: 'text-violet-600 bg-violet-50', accent: 'border-violet-100' },
  payout_approved: { label: 'Payout', icon: CreditCard, tone: 'text-amber-600 bg-amber-50', accent: 'border-amber-100' },
  new_review: { label: 'Review', icon: Star, tone: 'text-primary bg-primary/10', accent: 'border-primary/10' },
  system_alert: { label: 'System', icon: ShieldAlert, tone: 'text-dark bg-gray-100', accent: 'border-gray-200' },
};

export const getSellerNotificationMeta = (type) =>
  notificationMeta[type] || { label: 'Update', icon: Bell, tone: 'text-dark bg-gray-100', accent: 'border-gray-200' };

export const formatSellerNotificationTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const cleanNotificationTitle = (title = '') =>
  title
    .replace(/^\s*(new|🆕|✨|🔥|📦|🚚|✅|❌|🔔)\s+/i, '')
    .replace(
      /([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])/gu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

const payloadChips = (notification) => {
  const chips = [];

  // For new order: show items count and earnings
  if (notification.type === 'new_order') {
    if (notification.data?.items_count) {
      chips.push({
        key: 'items',
        label: `${notification.data.items_count} item${notification.data.items_count !== 1 ? 's' : ''}`,
        className: 'bg-blue-50 text-blue-700',
      });
    }
    if (notification.data?.restaurant_earnings) {
      chips.push({
        key: 'earnings',
        label: `You earn ${formatCurrency(Number(notification.data.restaurant_earnings))}`,
        className: 'bg-emerald-50 text-emerald-700 font-semibold',
      });
    }
  } 
  // For payouts: show amount
  else if (notification.data?.amount) {
    chips.push({
      key: 'amount',
      label: `${formatCurrency(Number(notification.data.amount))}`,
      className: 'bg-emerald-50 text-emerald-700',
    });
  }
  
  return chips;
};

const SellerNotificationCard = ({
  notification,
  compact = false,
  onMarkAsRead,
  onDelete,
  deleting = false,
  className,
}) => {
  const meta = getSellerNotificationMeta(notification.type);
  const Icon = meta.icon;
  const chips = payloadChips(notification);
  const title = cleanNotificationTitle(notification.title);

  return (
    <div
      className={cn(
        'transition-colors',
        notification.is_read ? 'bg-white' : 'bg-primary/[0.02]',
        compact
          ? 'border-b border-gray-100 px-4 py-4 sm:px-5'
          : 'border-b border-gray-100 px-0 py-4 sm:py-5',
        className
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', meta.tone)}>
          <Icon size={18} />
        </div>

      <div className="min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SellerStatusBadge className="text-[9px]" status={notification.is_read ? meta.label : 'unread'}>
                  {notification.is_read ? meta.label : 'Unread'}
                </SellerStatusBadge>
                <span className="text-xs font-semibold text-muted">{formatSellerNotificationTime(notification.created_at)}</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-dark">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{notification.message}</p>
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) =>
                chip.href ? (
                  <Link
                    key={chip.key}
                    to={chip.href}
                    className={cn('rounded-full px-3 py-1 text-xs font-semibold', chip.className)}
                  >
                    {chip.label}
                  </Link>
                ) : (
                  <span key={chip.key} className={cn('rounded-full px-3 py-1 text-xs font-semibold', chip.className)}>
                    {chip.label}
                  </span>
                )
              )}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            {!notification.is_read ? (
              <SellerQuietButton onClick={() => onMarkAsRead?.(notification.id)} className="min-h-[42px] justify-center bg-white sm:justify-start">
                Mark as read
              </SellerQuietButton>
            ) : null}
            <SellerQuietButton
              onClick={() => onDelete?.(notification.id)}
              disabled={deleting}
              icon={<Trash2 size={15} />}
              className={cn(
                'min-h-[42px] justify-center text-red-600 hover:bg-red-50 hover:text-red-700 sm:justify-start',
                !notification.is_read && 'ml-2'
              )}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </SellerQuietButton>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SellerNotificationCard;
