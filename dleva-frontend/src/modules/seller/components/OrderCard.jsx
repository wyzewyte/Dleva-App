import { Clock, User, Loader2, Truck, CheckCircle2, ChevronRight, UtensilsCrossed, XCircle } from 'lucide-react';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';

// ─── Status Action Button ─────────────────────────────────────────────────────

const ActionButton = ({ onClick, children, variant = 'primary', disabled = false, pulse = false }) => {
  const variants = {
    primary:   'bg-dark text-white hover:opacity-90',
    orange:    'bg-accent text-white hover:bg-accent-hover',
    blue:      'bg-sky-500 text-white hover:bg-sky-600',
    ghost:     'bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100',
    purple:    'bg-violet-50 border border-violet-200 text-violet-700',
    success:   'bg-gray-100 text-gray-500',
    danger:    'bg-red-50 border border-red-200 text-red-500',
    waiting:   'bg-emerald-50 border border-emerald-200 text-emerald-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] active:scale-[0.98] ${variants[variant]} ${pulse ? 'animate-pulse' : ''} ${disabled ? 'cursor-default' : ''}`}
    >
      {children}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OrderCard = ({ order, onStatusChange, onViewDetails }) => {
  const statusInfo = getStatusLabel(order.status);

  const itemNames = order.items?.map(i => i.menu_item).filter(Boolean).join(', ') || 'No items';
  const itemCount = order.items?.length || 0;
  const foodSubtotal = order.total_price - (order.delivery_fee || 0);

  const renderAction = () => {
    switch (order.status) {
      case 'pending':
        return (
          <ActionButton variant="primary" onClick={() => onStatusChange(order.id, 'confirming')}>
            Accept & Start Cooking
            <ChevronRight size={14} />
          </ActionButton>
        );
      case 'confirming':
        return (
          <ActionButton variant="blue" onClick={() => onStatusChange(order.id, 'preparing')}>
            <UtensilsCrossed size={13} />
            Start Cooking
          </ActionButton>
        );
      case 'preparing':
        return (
          <ActionButton variant="orange" onClick={() => onStatusChange(order.id, 'available_for_pickup')}>
            <CheckCircle2 size={13} />
            Mark as Ready
          </ActionButton>
        );
      case 'available_for_pickup':
      case 'awaiting_rider':
      case 'assigned':
        return (
          <ActionButton variant="waiting" disabled pulse>
            <Loader2 size={13} className="animate-spin" />
            Waiting for Rider...
          </ActionButton>
        );
      case 'arrived_at_pickup':
        return (
          <ActionButton variant="ghost" onClick={() => onViewDetails(order)}>
            <Truck size={13} />
            Verify & Hand Over
          </ActionButton>
        );
      case 'picked_up':
        return (
          <ActionButton variant="purple" disabled>
            <Truck size={13} />
            On the Way
          </ActionButton>
        );
      case 'delivered':
        return (
          <ActionButton variant="success" disabled>
            <CheckCircle2 size={13} />
            Delivered
          </ActionButton>
        );
      case 'cancelled':
        return (
          <ActionButton variant="danger" disabled>
            <XCircle size={13} />
            Cancelled
          </ActionButton>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-surface rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer border-l-4 ${statusInfo.borderColor}`}
      onClick={() => onViewDetails(order)}
    >
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-dark">#{order.id}</span>
          {/* Status pill */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full truncate ${statusInfo.bgColor || 'bg-gray-100'} ${statusInfo.textColor || 'text-gray-600'}`}>
            {statusInfo.label}
          </span>
        </div>
        {/* Time elapsed */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted bg-gray-50 px-2 py-1 rounded-lg flex-shrink-0">
          <Clock size={11} />
          <span>{order.time_elapsed || 'Just now'}</span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-gray-50 mx-3.5" />

      {/* ── Order Details ── */}
      <div className="px-3.5 py-2.5 space-y-2">

        {/* Customer */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={12} className="text-muted" />
          </div>
          <span className="text-xs font-bold text-dark truncate">{order.buyer || 'Customer'}</span>
        </div>

        {/* Items */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <UtensilsCrossed size={11} className="text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted line-clamp-2 leading-relaxed">{itemNames}</p>
            <p className="text-[11px] text-muted mt-0.5">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted font-medium">Order total</span>
          <span className="text-sm font-bold text-primary">{formatCurrency(foodSubtotal)}</span>
        </div>
      </div>

      {/* ── Action ── */}
      <div
        className="px-3.5 pb-3.5"
        onClick={e => e.stopPropagation()}
      >
        {renderAction()}
      </div>
    </div>
  );
};

export default OrderCard;