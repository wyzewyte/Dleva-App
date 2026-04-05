import { ArrowRight, Clock3, MapPin, Store } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { RiderCard, RiderPrimaryButton, RiderStatusBadge } from './ui/RiderPrimitives';

/**
 * ActiveOrdersList
 * Props:
 * - orders: array
 * - loading: boolean
 * - compact: boolean (smaller UI for dashboard)
 * - onOpen(orderId)
 */
const ActiveOrdersList = ({ orders = [], loading = false, compact = false, onOpen = () => {} }) => {
  if (loading && orders.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(compact ? 1 : 2)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-600">No active deliveries</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const orderId = order.id || order.order_id;
        const restaurantName = order.restaurant_name || order.restaurant || 'Restaurant';
        const distanceKm = typeof order.distance_km === 'string' ? parseFloat(order.distance_km) : (order.distance_km || 0);
        const riderEarning = typeof order.rider_earning === 'string' ? parseFloat(order.rider_earning) : (order.rider_earning || 0);

        if (compact) {
          return (
            <RiderCard key={orderId} className="p-3.5">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-bold text-dark">Order #{orderId}</p>
                      <RiderStatusBadge status={order.status || 'accepted'}>
                        {String(order.status || 'accepted').replace(/_/g, ' ')}
                      </RiderStatusBadge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-dark">
                      <Store size={13} className="text-primary" />
                      <span className="truncate">{restaurantName}</span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700">Pay</p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">{formatCurrency(riderEarning)}</p>
                  </div>
                </div>

                <p className="line-clamp-1 text-sm text-muted">
                  {order.delivery_address || order.dropoff_location || 'Address unavailable'}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {distanceKm.toFixed(1)} km
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {order.updated_at ? new Date(order.updated_at).toLocaleTimeString() : 'Live'}
                    </span>
                  </div>
                  <RiderPrimaryButton
                    onClick={() => onOpen(orderId)}
                    className="w-auto min-w-[116px] px-3 py-2 text-xs"
                    icon={<ArrowRight size={14} />}
                  >
                    Open order
                  </RiderPrimaryButton>
                </div>
              </div>
            </RiderCard>
          );
        }

        return (
          <RiderCard key={orderId} className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-dark">Order #{orderId}</p>
                    <RiderStatusBadge status={order.status || 'accepted'}>
                      {String(order.status || 'accepted').replace(/_/g, ' ')}
                    </RiderStatusBadge>
                  </div>
                  <p className="mt-1.5 flex items-center gap-2 text-sm text-dark">
                    <Store size={14} className="text-primary" />
                    <span className="truncate">{restaurantName}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Pay</p>
                  <p className="mt-1 text-base font-bold text-emerald-700">{formatCurrency(riderEarning)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 px-3 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Drop-off</p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-dark">
                  {order.delivery_address || order.dropoff_location || 'Address unavailable'}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1 text-xs text-muted">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    <span>{distanceKm.toFixed(1)} km</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock3 size={13} />
                    <span>{order.updated_at ? new Date(order.updated_at).toLocaleTimeString() : 'Live'}</span>
                  </p>
                </div>
                <RiderPrimaryButton
                  onClick={() => onOpen(orderId)}
                  className="w-auto min-w-[132px] px-4 py-2.5"
                  icon={<ArrowRight size={15} />}
                >
                  Open order
                </RiderPrimaryButton>
              </div>
            </div>
          </RiderCard>
        );
      })}
    </div>
  );
};

export default ActiveOrdersList;
