import { CheckCircle2, Clock, MapPin, Store, User } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { RiderCard, RiderPrimaryButton, RiderSecondaryButton, RiderStatusBadge } from './ui/RiderPrimitives';

const formatPlacedDateTime = (value) => {
  if (!value) return 'Just now';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  const dateLabel = parsedDate.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });

  const timeLabel = parsedDate.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  });

  return `${dateLabel}, ${timeLabel}`;
};

const OrderCard = ({ order, onAccept, onReject, isLoading }) => {
  // Defensive checks
  if (!order) return null;

  // Safe property accessors with defaults
  const orderId = order.id || order.order_id || 'N/A';
  const timeCreated = formatPlacedDateTime(order.time_created || order.created_at);
  const isUrgent = order.is_urgent || false;
  const restaurantName = order.restaurant_name || 'Restaurant';
  const restaurantAddress = order.restaurant_address || 'Address not available';
  const restaurantImage = order.restaurant_image || null;
  const buyerName = order.buyer_name || 'Buyer';
  const distanceKm = typeof order.distance_km === 'string' ? parseFloat(order.distance_km) : (order.distance_km || 0);
  const estimatedTimeMinutes = order.estimated_time_minutes || 30;
  const estimatedEarnings = typeof order.estimated_earnings === 'string' ? parseFloat(order.estimated_earnings) : (order.estimated_earnings || 0);
  const specialInstructions = order.special_instructions || null;

  return (
    <RiderCard className="p-4 sm:p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-dark">Order #{orderId}</h3>
          {isUrgent ? <RiderStatusBadge status="blocked">Urgent</RiderStatusBadge> : null}
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <Clock size={12} />
          <span>Placed {timeCreated}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary">
                <Store size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-dark">{restaurantName}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{restaurantAddress}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Buyer</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-dark">
                <User size={14} className="text-primary" />
                <span className="truncate">{buyerName}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Distance</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-dark">
                <MapPin size={14} className="text-primary" />
                <span>{distanceKm.toFixed(1)} km</span>
              </p>
            </div>
          </div>

          {specialInstructions ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              <span className="font-bold">Special instructions:</span> {specialInstructions}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {restaurantImage ? (
            <img
              src={restaurantImage}
              alt={restaurantName}
              className="h-32 w-full rounded-2xl object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-muted">
              Pickup preview unavailable
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-gray-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Pickup ETA</p>
              <p className="mt-2 text-base font-bold text-dark">{estimatedTimeMinutes} mins</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Estimated pay</p>
              <p className="mt-2 text-base font-bold text-emerald-700">{formatCurrency(estimatedEarnings)}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <RiderSecondaryButton onClick={() => onReject(orderId)} disabled={isLoading}>
              Reject
            </RiderSecondaryButton>
            <RiderPrimaryButton
              onClick={() => onAccept(orderId)}
              loading={isLoading}
              icon={!isLoading ? <CheckCircle2 size={16} /> : null}
            >
              Accept order
            </RiderPrimaryButton>
          </div>
        </div>
      </div>
    </RiderCard>
  );
};

export default OrderCard;
