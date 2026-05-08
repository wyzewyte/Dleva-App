import { CheckCircle2, ChevronRight, Clock3, Loader2, Truck, User, UtensilsCrossed, XCircle } from 'lucide-react';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';
import { SellerPrimaryButton, SellerSecondaryButton, SellerStatusBadge } from './ui/SellerPrimitives';

const formatElapsedTime = (value) => {
  if (!value) return 'Time unavailable';

  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return 'Time unavailable';

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 60000) return 'Just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return parsed.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
};

const OrderCard = ({ order, onStatusChange, onViewDetails, isUpdating = false, compact = false }) => {
  const statusInfo = getStatusLabel(order.status);
  const itemNames = order.items?.map((item) => item.menu_item).filter(Boolean).join(', ') || 'No items';
  const itemCount = order.items?.length || 0;
  
  // Seller earnings come from the backend commission calculation.
  const restaurantEarnings = Number(order.restaurant_earnings ?? 0);
  
  const createdTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const elapsedTime = order.time_elapsed || formatElapsedTime(order.created_at);

  const renderAction = () => {
    switch (order.status) {
      case 'pending':
        return (
          <SellerPrimaryButton
            className="text-sm"
            loading={isUpdating}
            onClick={() => onStatusChange(order.id, 'confirming')}
            icon={!isUpdating ? <ChevronRight size={16} /> : null}
          >
            Accept order
          </SellerPrimaryButton>
        );
      case 'confirming':
        return (
          <SellerSecondaryButton
            className="text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, 'preparing')}
            icon={isUpdating ? <Loader2 size={16} className="animate-spin" /> : <UtensilsCrossed size={16} />}
          >
            Start cooking
          </SellerSecondaryButton>
        );
      case 'preparing':
        return (
          <SellerPrimaryButton
            className="bg-amber-500 text-sm hover:bg-amber-600"
            loading={isUpdating}
            onClick={() => onStatusChange(order.id, 'available_for_pickup')}
            icon={!isUpdating ? <CheckCircle2 size={16} /> : null}
          >
            Mark ready
          </SellerPrimaryButton>
        );
      case 'available_for_pickup':
      case 'awaiting_rider':
      case 'assigned':
        return (
          <button type="button" disabled className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
            <Loader2 size={14} className="animate-spin" />
            Waiting for rider
          </button>
        );
      case 'arrived_at_pickup':
        return (
          <SellerSecondaryButton className="text-sm" onClick={() => onViewDetails(order)} icon={<Truck size={16} />}>
            Verify handoff
          </SellerSecondaryButton>
        );
      case 'picked_up':
        return (
          <button type="button" disabled className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-bold text-violet-700">
            <Truck size={14} />
            On the way
          </button>
        );
      case 'delivered':
        return (
          <button type="button" disabled className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-xs font-bold text-gray-600">
            <CheckCircle2 size={14} />
            Delivered
          </button>
        );
      case 'cancelled':
        return (
          <button type="button" disabled className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
            <XCircle size={14} />
            Cancelled
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <article
      className={cn(
        'cursor-pointer rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_8px_22px_rgba(15,23,42,0.07)]',
        compact && 'p-3'
      )}
      onClick={() => onViewDetails(order)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-dark">#{order.id}</p>
            <SellerStatusBadge status={order.status}>{statusInfo.label}</SellerStatusBadge>
          </div>
          <p className="mt-2 text-xs font-medium text-muted">{createdTime}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-gray-100 bg-[#fbfbfa] px-3 py-2 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {elapsedTime}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-dark">{order.customer_name || order.buyer || 'Customer'}</p>
            <p className="text-xs text-muted">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-[#fbfbfa] px-3 py-3">
          <p className="line-clamp-2 text-sm font-medium leading-6 text-dark">{itemNames}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">You Earn</span>
          <span className="text-base font-bold text-primary">{formatCurrency(restaurantEarnings)}</span>
        </div>
      </div>

      <div className="mt-4" onClick={(event) => event.stopPropagation()}>
        {renderAction()}
      </div>
    </article>
  );
};

export default OrderCard;
