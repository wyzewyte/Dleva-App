import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { riderOrders } from '../services';
import { formatCurrency } from '../../../utils/formatters';
import {
  RiderCard,
  RiderEmptyState,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSegmentedTabs,
} from '../components/ui/RiderPrimitives';

const STATUS_TABS = [
  { id: 'delivered', label: 'Delivered' },
  { id: 'delivery_attempted', label: 'Attempted' },
  { id: 'cancelled', label: 'Cancelled' },
];

const OrderHistory = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('delivered');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  const loadHistory = useCallback(async (nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const response = await riderOrders.getOrderHistory({
        status: nextStatus,
        date_from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
      });
      setOrders(Array.isArray(response.orders) ? response.orders : response.results || []);
    } catch (loadError) {
      setError(loadError?.error || 'Unable to load rider history right now.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadHistory(status).catch(() => {});
  }, [loadHistory, status]);

  const totalEarnings = useMemo(
    () =>
      orders.reduce((sum, order) => sum + parseFloat(order?.rider_earning || 0), 0),
    [orders]
  );

  return (
    <RiderPageShell maxWidth="max-w-5xl">
      <RiderPageHeader
        title="Order History"
        subtitle="Past deliveries should be easy to review without turning history into a hard-to-use report page."
        sticky
      />

      <div className="space-y-6 py-6">
        <RiderCard className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Last 30 days</p>
              <p className="mt-3 text-3xl font-bold text-dark">{orders.length}</p>
              <p className="mt-2 text-sm text-muted">Completed or reviewed delivery records in the selected status.</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Rider earnings</p>
              <p className="mt-3 text-3xl font-bold text-dark">{formatCurrency(totalEarnings)}</p>
              <p className="mt-2 text-sm text-muted">Total rider income across the visible delivery history.</p>
            </div>
          </div>
        </RiderCard>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-dark">Filter by status</h2>
              <p className="text-sm text-muted">Keep the filter simple and centered on the outcomes riders usually look back on.</p>
            </div>
            <Filter size={18} className="text-muted" />
          </div>
          <RiderSegmentedTabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <RiderCard key={row} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              </RiderCard>
            ))}
          </div>
        ) : error ? (
          <RiderFeedbackState
            type="error"
            title="Unable to load order history"
            message={error}
            action={
              <RiderPrimaryButton onClick={() => loadHistory()} className="sm:w-auto sm:px-5">
                Try again
              </RiderPrimaryButton>
            }
          />
        ) : orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.id || order.order_id}
                type="button"
                onClick={() => navigate(`/rider/orders/${order.id || order.order_id}`, { state: { order } })}
                className="w-full text-left"
              >
                <RiderCard className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-dark">Order #{order.id || order.order_id}</p>
                      <p className="mt-1 text-sm text-muted">{order.restaurant_name || 'Restaurant'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-dark">{formatCurrency(order.rider_earning || 0)}</p>
                      <p className="mt-1 text-xs text-muted">{order.delivered_at ? new Date(order.delivered_at).toLocaleString() : 'Recent'}</p>
                    </div>
                  </div>
                </RiderCard>
              </button>
            ))}
          </div>
        ) : (
          <RiderEmptyState
            icon={<Calendar size={28} />}
            title="No delivery history in this status"
            description="Switch the status filter or come back after more deliveries have been completed."
          />
        )}
      </div>
    </RiderPageShell>
  );
};

export default OrderHistory;
