import { CheckCircle2, Clock3, Copy, MapPin, Phone, Truck, UtensilsCrossed, X, XCircle } from 'lucide-react';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';
import { SellerPrimaryButton, SellerSecondaryButton, SellerStatusBadge } from './ui/SellerPrimitives';

const OrderModal = ({ order, isOpen, onClose, onStatusChange, isUpdating = false }) => {
  if (!isOpen || !order) return null;

  const statusInfo = getStatusLabel(order.status);
  
  // Commission and seller earnings are backend-calculated.
  const foodSubtotal = Number(order.food_subtotal ?? 0);
  const commissionAmount = Number(order.commission_amount ?? 0);
  const commissionPercent = Number(order.commission_percent ?? 0);
  const restaurantEarnings = Number(order.restaurant_earnings ?? 0);
  
  const itemCount = order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

  const handleCopyAddress = async () => {
    if (!order.customer_address) return;
    await navigator.clipboard.writeText(order.customer_address);
  };

  const renderAction = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex flex-col gap-3 sm:flex-row">
            <SellerSecondaryButton
              className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isUpdating}
              onClick={async () => {
                const updated = await onStatusChange(order.id, 'cancelled');
                if (updated) onClose();
              }}
              icon={isUpdating ? null : <XCircle size={16} />}
            >
              Reject order
            </SellerSecondaryButton>
            <SellerPrimaryButton
              loading={isUpdating}
              onClick={async () => {
                const updated = await onStatusChange(order.id, 'confirming');
                if (updated) onClose();
              }}
            >
              Accept and start prep
            </SellerPrimaryButton>
          </div>
        );
      case 'confirming':
        return (
          <SellerSecondaryButton
            className="disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUpdating}
            onClick={async () => {
              const updated = await onStatusChange(order.id, 'preparing');
              if (updated) onClose();
            }}
            icon={<UtensilsCrossed size={16} />}
          >
            Start cooking
          </SellerSecondaryButton>
        );
      case 'preparing':
        return (
          <SellerPrimaryButton
            className="bg-amber-500 hover:bg-amber-600"
            loading={isUpdating}
            onClick={async () => {
              const updated = await onStatusChange(order.id, 'available_for_pickup');
              if (updated) onClose();
            }}
            icon={!isUpdating ? <CheckCircle2 size={16} /> : null}
          >
            Mark ready for pickup
          </SellerPrimaryButton>
        );
      case 'arrived_at_pickup':
        return <SellerSecondaryButton icon={<Truck size={16} />}>Verify rider handoff</SellerSecondaryButton>;
      default:
        return null;
    }
  };

  const action = renderAction();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-6">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl md:rounded-[24px]">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-dark">Order #{order.id}</h2>
                <SellerStatusBadge status={order.status}>{statusInfo.label}</SellerStatusBadge>
              </div>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                <Clock3 size={14} />
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-dark transition-colors hover:bg-gray-50" aria-label="Close order details">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfbfa] px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Items</p>
                <p className="mt-2 text-2xl font-bold leading-none text-dark">{itemCount}</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-primary/10 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">You earn</p>
                <p className="mt-2 text-2xl font-bold leading-none text-dark">{formatCurrency(restaurantEarnings)}</p>
              </div>
            </div>

            <div className="rounded-[20px] border border-gray-100 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Customer</p>
              <p className="mt-3 text-base font-bold text-dark">{order.customer_name || order.buyer || 'Unknown customer'}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Phone</p>
                  <a href={`tel:${order.customer_phone || ''}`} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/15 bg-primary/10 px-3 text-sm font-bold text-primary">
                    <Phone size={14} />
                    {order.customer_phone || 'Not available'}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Address</p>
                  <div className="mt-2 flex items-start gap-2 text-sm text-dark">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-muted" />
                    <span>{order.customer_address || 'No delivery address available'}</span>
                  </div>
                  {order.customer_address ? (
                    <button type="button" onClick={handleCopyAddress} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-primary">
                      <Copy size={14} />
                      Copy address
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-gray-100 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Items to prepare</p>
              <div className="mt-4 space-y-3">
                {order.items?.map((item, index) => (
                  <div key={`${item.menu_item}-${index}`} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-[#fbfbfa] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-dark">{item.quantity}x {item.menu_item}</p>
                      <p className="mt-1 text-xs text-muted">{formatCurrency(Number(item.price || 0))} each</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-dark">{formatCurrency(Number(item.subtotal || 0))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-gray-100 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Summary</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted">
                  <span>Food subtotal</span>
                  <span className="font-semibold text-dark">{formatCurrency(foodSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-600">
                  <span>Commission ({commissionPercent}%)</span>
                  <span className="font-semibold text-amber-600">-{formatCurrency(commissionAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base font-bold text-primary">
                  <span>You Earn</span>
                  <span>{formatCurrency(restaurantEarnings)}</span>
                </div>
              </div>
            </div>
          </div>

          {action ? <div className="border-t border-gray-100 bg-white px-4 py-4 sm:px-6">{action}</div> : null}
        </div>
      </div>
    </>
  );
};

export default OrderModal;
