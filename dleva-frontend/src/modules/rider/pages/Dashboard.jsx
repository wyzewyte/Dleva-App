import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useOrder } from '../context/OrderContext';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import riderWallet from '../services/riderWallet';
import toast from '../../../services/toast';
import { formatCurrency } from '../../../utils/formatters';
import {
  RiderCard,
  RiderEmptyState,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderQuietButton,
  RiderSecondaryButton,
} from '../components/ui/RiderPrimitives';
import OrderCard from '../components/OrderCard';
import ActiveOrdersList from '../components/ActiveOrdersList';

const Dashboard = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const { availableOrders, activeOrders, loading, error, actions } = useOrder();
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [earningsToday, setEarningsToday] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);

  useOrderWebSocket({
    autoConnect: true,
    autoRefreshNewOrder: true,
    autoRefreshStatusUpdate: true,
    onNewOrder: (data) => {
      toast.success(`New order from ${data.restaurant_name || 'restaurant'} is ready.`);
    },
  });

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks = [actions.fetchActiveOrders()];
      if (rider?.can_go_online) {
        tasks.push(actions.fetchAvailableOrders());
      }
      await Promise.all(tasks);

      setEarningsLoading(true);
      try {
        const earnings = await riderWallet.getEarningsToday();
        setEarningsToday(parseFloat(earnings?.earnings?.total_earned || earnings?.earnings?.amount || 0));
      } catch {
        setEarningsToday(0);
      } finally {
        setEarningsLoading(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, [actions, rider?.can_go_online]);

  useEffect(() => {
    if (rider) {
      loadDashboard().catch(() => {});
    }
  }, [loadDashboard, rider]);

  const latestActiveOrders = useCallback(() => {
    return [...activeOrders]
      .sort((left, right) => {
        const rightTime = new Date(right?.updated_at || right?.created_at || 0).getTime();
        const leftTime = new Date(left?.updated_at || left?.created_at || 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 3);
  }, [activeOrders]);

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await actions.acceptOrder(orderId);
      toast.success('Order accepted. It has moved into your active queue.');
      await actions.fetchActiveOrders();
    } catch (acceptError) {
      toast.error(acceptError?.error || 'Unable to accept this order right now.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm('Reject this order?')) return;
    try {
      await actions.rejectOrder(orderId, 'Rejected by rider');
      toast.success('Order rejected.');
    } catch (rejectError) {
      toast.error(rejectError?.error || 'Unable to reject this order right now.');
    }
  };

  return (
    <RiderPageShell maxWidth="max-w-6xl">
      <RiderPageHeader
        title="Dashboard"
        subtitle="Your rider day starts here. Check what needs attention, then move straight into the next task."
        sticky
        action={
          <RiderQuietButton onClick={() => loadDashboard()} icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}>
            Refresh
          </RiderQuietButton>
        }
      />

      <div className="space-y-6 py-6">
        {!rider?.can_go_online ? (
          <RiderCard className="border-amber-100 bg-amber-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800">Verification is still blocking work</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  Complete the remaining setup steps so you can go online and start receiving orders.
                </p>
              </div>
              <RiderPrimaryButton onClick={() => navigate('/rider/verification-setup')} className="w-full sm:w-auto sm:px-5">
                Finish verification
              </RiderPrimaryButton>
            </div>
          </RiderCard>
        ) : null}

        {error ? (
          <RiderFeedbackState
            type="error"
            title="We could not refresh your rider data"
            message={error}
            action={
              <RiderPrimaryButton onClick={() => loadDashboard()} className="sm:w-auto sm:px-5">
                Try again
              </RiderPrimaryButton>
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RiderCard className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              <Truck size={14} className="text-primary" />
              Active deliveries
            </p>
            <p className="mt-2 text-[2rem] font-bold leading-none text-dark">{activeOrders.length}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {activeOrders.length > 0 ? 'Needs attention first.' : 'No active work right now.'}
            </p>
          </RiderCard>

          <RiderCard className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              <ClipboardList size={14} className="text-primary" />
              Available orders
            </p>
            <p className="mt-2 text-[2rem] font-bold leading-none text-dark">{availableOrders.length}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {availableOrders.length > 0 ? 'Fresh requests are waiting.' : 'No new requests yet.'}
            </p>
          </RiderCard>

          <RiderCard className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              <CircleDollarSign size={14} className="text-primary" />
              Today&apos;s earnings
            </p>
            <p className="mt-2 text-[2rem] font-bold leading-none text-dark">
              {earningsLoading ? '...' : formatCurrency(earningsToday)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">What you have earned today.</p>
          </RiderCard>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-dark">Active orders</h2>
            </div>
            {activeOrders.length > 0 ? (
              <RiderSecondaryButton onClick={() => navigate('/rider/deliveries?tab=ongoing')} className="w-auto px-4">
                View all
              </RiderSecondaryButton>
            ) : null}
          </div>

          {loading && activeOrders.length === 0 ? (
            <div className="space-y-3">
              {[1, 2].map((row) => (
                <RiderCard key={row} className="p-4">
                  <div className="space-y-3">
                    <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </RiderCard>
              ))}
            </div>
          ) : activeOrders.length > 0 ? (
            <ActiveOrdersList
              orders={latestActiveOrders()}
              compact
              onOpen={(orderId) => navigate(`/rider/orders/${orderId}`)}
            />
          ) : (
            <RiderEmptyState
              icon={<CheckCircle2 size={28} />}
              title="No active deliveries"
              description="Once you accept a request it will appear here, so you always know what to work on next."
              action={
                <RiderPrimaryButton onClick={() => navigate('/rider/deliveries?tab=pending')} className="sm:w-auto sm:px-5">
                  Browse deliveries
                </RiderPrimaryButton>
              }
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-dark">Available orders</h2>
            </div>
            {availableOrders.length > 0 ? (
              <RiderSecondaryButton onClick={() => navigate('/rider/deliveries?tab=pending')} className="w-auto px-4">
                Open deliveries
              </RiderSecondaryButton>
            ) : null}
          </div>

          {loading && availableOrders.length === 0 ? (
            <div className="space-y-4">
              {[1, 2].map((row) => (
                <RiderCard key={row} className="p-5">
                  <div className="space-y-3">
                    <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                    <div className="flex gap-3 pt-2">
                      <div className="h-11 w-28 animate-pulse rounded-xl bg-gray-100" />
                      <div className="h-11 w-28 animate-pulse rounded-xl bg-gray-100" />
                    </div>
                  </div>
                </RiderCard>
              ))}
            </div>
          ) : availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.slice(0, 2).map((order) => (
                <OrderCard
                  key={order.id || order.order_id}
                  order={order}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isLoading={acceptingId === (order.id || order.order_id)}
                />
              ))}
            </div>
          ) : (
            <RiderEmptyState
              icon={<ClipboardList size={28} />}
              title="No available orders yet"
              description="Keep your work status online and refresh again shortly. New requests will appear here as soon as they land."
              action={
                <RiderSecondaryButton onClick={() => loadDashboard()} className="sm:w-auto sm:px-5">
                  Refresh dashboard
                </RiderSecondaryButton>
              }
            />
          )}
        </section>
      </div>
    </RiderPageShell>
  );
};

export default Dashboard;
