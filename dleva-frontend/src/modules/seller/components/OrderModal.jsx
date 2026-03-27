import { X, Clock, User, MapPin, Phone, Copy, AlertTriangle, CheckCircle2, Truck, ChefHat, Loader2, Star, UtensilsCrossed, XCircle, ChevronRight, Package } from 'lucide-react';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';

// ─── Action Button ────────────────────────────────────────────────────────────

const ActionBtn = ({ onClick, children, variant = 'dark', className = '' }) => {
  const variants = {
    dark:    'bg-dark text-white hover:opacity-90',
    orange:  'bg-accent text-white hover:bg-accent-hover',
    blue:    'bg-sky-500 text-white hover:bg-sky-600',
    red:     'border-2 border-red-200 text-red-600 hover:bg-red-50',
    ghost:   'bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100',
    purple:  'bg-violet-50 border border-violet-200 text-violet-700',
    success: 'bg-gray-100 text-gray-500',
    danger:  'bg-red-50 border border-red-100 text-red-500',
    waiting: 'bg-emerald-50 border border-emerald-200 text-emerald-700 animate-pulse',
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] min-h-[48px] ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, children, accent = 'text-muted' }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={14} className={accent} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-0.5">{label}</p>
      {children}
    </div>
  </div>
);

// ─── Section ──────────────────────────────────────────────────────────────────

const Section = ({ title, children, className = '' }) => (
  <div className={className}>
    {title && (
      <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3">{title}</p>
    )}
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const OrderModal = ({ order, isOpen, onClose, onStatusChange }) => {
  if (!isOpen || !order) return null;

  const isActive = !['delivered', 'cancelled'].includes(order.status);
  const statusInfo = getStatusLabel(order.status);
  const foodSubtotal = order.total_price - (order.delivery_fee || 0);

  const copyAddress = () => {
    if (!isActive) return;
    navigator.clipboard.writeText(order.customer_address || '');
  };

  const renderActions = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-3">
            <ActionBtn
              variant="red"
              onClick={() => {
                if (window.confirm('Reject this order?')) {
                  onStatusChange(order.id, 'cancelled');
                  onClose();
                }
              }}
            >
              <XCircle size={16} /> Reject
            </ActionBtn>
            <ActionBtn
              variant="dark"
              onClick={() => { onStatusChange(order.id, 'confirming'); onClose(); }}
            >
              Accept & Cook <ChevronRight size={16} />
            </ActionBtn>
          </div>
        );
      case 'confirming':
        return (
          <ActionBtn variant="blue" onClick={() => { onStatusChange(order.id, 'preparing'); onClose(); }}>
            <UtensilsCrossed size={15} /> Start Cooking
          </ActionBtn>
        );
      case 'preparing':
        return (
          <ActionBtn variant="orange" onClick={() => { onStatusChange(order.id, 'available_for_pickup'); onClose(); }}>
            <CheckCircle2 size={15} /> Mark Ready for Pickup
          </ActionBtn>
        );
      case 'available_for_pickup':
      case 'awaiting_rider':
      case 'assigned':
        return (
          <div className="flex items-center justify-center gap-2 py-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <Loader2 size={15} className="animate-spin text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">Finding Rider...</span>
          </div>
        );
      case 'arrived_at_pickup':
        return (
          <ActionBtn variant="ghost">
            <Truck size={15} /> Verify & Hand Over
          </ActionBtn>
        );
      case 'picked_up':
        return (
          <div className="flex items-center justify-center gap-2 py-3.5 bg-violet-50 border border-violet-200 rounded-2xl">
            <Truck size={15} className="text-violet-600" />
            <span className="text-sm font-bold text-violet-700">On the Way to Customer</span>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center justify-center gap-2 py-3.5 bg-gray-100 rounded-2xl">
            <CheckCircle2 size={15} className="text-gray-500" />
            <span className="text-sm font-bold text-gray-500">Order Delivered</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-100 rounded-2xl">
            <XCircle size={15} className="text-red-500" />
            <span className="text-sm font-bold text-red-500">Order Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — bottom on mobile, centered on desktop */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
        <div className="bg-surface w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] md:max-h-[88vh] overflow-hidden">

          {/* ── Drag handle (mobile) ── */}
          <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 pt-3 pb-4 flex-shrink-0 border-b border-gray-100">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-dark">Order #{order.id}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusInfo.bgColor || 'bg-gray-100'} ${statusInfo.textColor || 'text-gray-600'}`}>
                  {statusInfo.label}
                </span>
                {!isActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200">
                    Archived
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={12} className="text-muted" />
                <span className="text-xs text-muted">
                  {new Date(order.created_at).toLocaleString([], {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 ml-3"
            >
              <X size={16} className="text-dark" />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* ── Customer Info ── */}
            <Section title="Customer">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                <InfoRow icon={User} label="Name" accent="text-primary">
                  <p className="text-sm font-bold text-dark">{order.customer_name || 'Unknown'}</p>
                  <p className="text-xs text-muted">Verified Customer</p>
                </InfoRow>

                <div className="h-px bg-gray-200" />

                <InfoRow icon={MapPin} label="Delivery Address" accent="text-orange-500">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-dark font-medium leading-snug break-words flex-1">
                      {order.customer_address || 'N/A'}
                    </p>
                    {isActive && (
                      <button
                        onClick={copyAddress}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex-shrink-0"
                      >
                        <Copy size={12} className="text-muted" />
                      </button>
                    )}
                  </div>
                </InfoRow>

                <div className="h-px bg-gray-200" />

                <InfoRow icon={Phone} label="Phone" accent="text-sky-500">
                  {isActive ? (
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="text-sm font-bold text-primary hover:underline"
                    >
                      {order.customer_phone || 'N/A'}
                    </a>
                  ) : (
                    <span className="text-sm text-muted">{order.customer_phone?.slice(0, 4)}**** (Hidden)</span>
                  )}
                </InfoRow>
              </div>
            </Section>

            {/* ── Rider Info ── */}
            {['available_for_pickup', 'awaiting_rider', 'assigned', 'arrived_at_pickup', 'picked_up', 'delivered'].includes(order.status) && (
              <Section title="Rider">
                {order.rider ? (
                  <div className={`bg-gray-50 rounded-2xl p-4 ${!isActive ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                          {order.rider.first_name?.[0]}{order.rider.last_name?.[0] || ''}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-dark truncate">
                            {order.rider.full_name || `${order.rider.first_name} ${order.rider.last_name}`}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Star size={11} fill="#f47b00" className="text-accent" />
                            <span className="text-xs text-muted">{order.rider.rating || '4.8'}</span>
                            {order.rider.vehicle_plate_number && (
                              <>
                                <span className="text-muted">·</span>
                                <span className="text-xs text-muted">{order.rider.vehicle_plate_number}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {isActive && order.rider.phone_number && (
                        <a
                          href={`tel:${order.rider.phone_number}`}
                          className="w-9 h-9 flex items-center justify-center bg-violet-100 rounded-xl text-violet-600 hover:bg-violet-200 transition-colors flex-shrink-0"
                        >
                          <Phone size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Finding a rider...</p>
                      <p className="text-xs text-amber-700 mt-0.5">This usually takes 30 seconds.</p>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* ── Order Items ── */}
            <Section title="Items to Prepare">
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-3 px-4 py-3 ${idx < order.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[11px] font-bold text-dark flex-shrink-0">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-dark truncate">{item.menu_item}</p>
                        <p className="text-xs text-muted">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-dark flex-shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Pricing ── */}
            <Section>
              <div className="space-y-2.5 bg-gray-50 rounded-2xl px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Food subtotal</span>
                  <span className="font-semibold text-dark">{formatCurrency(foodSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm pb-2.5 border-b border-gray-200">
                  <span className="text-muted">Delivery fee</span>
                  <span className="font-semibold text-accent">{formatCurrency(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-sm font-bold text-dark">Total</span>
                  <span className="text-xl font-bold text-dark">{formatCurrency(order.total_price)}</span>
                </div>
              </div>
            </Section>

          </div>

          {/* ── Footer Actions ── */}
          <div className="px-5 pt-3 pb-6 border-t border-gray-100 flex-shrink-0 bg-surface">
            {renderActions()}
          </div>

        </div>
      </div>
    </>
  );
};

export default OrderModal;