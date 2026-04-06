import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, RefreshCw, Search, Truck } from 'lucide-react';
import { useOrder } from '../context/OrderContext';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import toast from '../../../services/toast';
import ActiveOrdersList from '../components/ActiveOrdersList';
import OrderCard from '../components/OrderCard';
import {
  RiderEmptyState,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSearchField,
  RiderSecondaryButton,
  RiderSegmentedTabs,
} from '../components/ui/RiderPrimitives';

const TABS = [
  { id: 'pending', label: 'Pending orders' },
  { id: 'ongoing', label: 'Ongoing orders' },
];

const DELIVERY_PREFERENCES_KEY = 'rider_delivery_preferences_v1';

const getDeliveryPreferences = () => {
  if (typeof window === 'undefined') {
    return {
      defaultDeliveriesTab: 'pending',
      openOngoingAfterAccept: true,
    };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(DELIVERY_PREFERENCES_KEY) || '{}');
    return {
      defaultDeliveriesTab: parsed?.defaultDeliveriesTab === 'ongoing' ? 'ongoing' : 'pending',
      openOngoingAfterAccept: parsed?.openOngoingAfterAccept !== false,
    };
  } catch {
    return {
      defaultDeliveriesTab: 'pending',
      openOngoingAfterAccept: true,
    };
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const { availableOrders, activeOrders, loading, error, actions } = useOrder();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const activeTab = searchParams.get('tab') === 'ongoing' ? 'ongoing' : 'pending';
  const { fetchAvailableOrders, fetchActiveOrders, acceptOrder, rejectOrder } = actions;

  useOrderWebSocket({
    autoConnect: true,
    autoRefreshNewOrder: true,
    autoRefreshStatusUpdate: true,
    onNewOrder: (data) => {
      toast.success(`New order from ${data.restaurant_name || 'restaurant'} is ready.`);
    },
  });

  const loadDeliveries = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAvailableOrders(), fetchActiveOrders()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActiveOrders, fetchAvailableOrders]);

  useEffect(() => {
    loadDeliveries().catch(() => {});
  }, [loadDeliveries]);

  useEffect(() => {
    if (searchParams.get('tab')) return;

    const preferredTab = getDeliveryPreferences().defaultDeliveriesTab;
    setSearchParams({ tab: preferredTab }, { replace: true });
  }, [searchParams, setSearchParams]);

  const filteredAvailableOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return availableOrders;
    return availableOrders.filter((order) => {
      const haystack = [
        order.restaurant_name,
        order.buyer_name,
        order.delivery_address,
        order.special_instructions,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [availableOrders, query]);

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await acceptOrder(orderId);
      toast.success('Order accepted. It has moved to your ongoing deliveries.');
      if (getDeliveryPreferences().openOngoingAfterAccept) {
        setSearchParams({ tab: 'ongoing' });
      }
      await fetchActiveOrders();
    } catch (acceptError) {
      toast.error(acceptError?.error || 'Unable to accept this order right now.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm('Reject this order?')) return;
    try {
      await rejectOrder(orderId, 'Rejected by rider');
      toast.success('Order rejected.');
    } catch (rejectError) {
      toast.error(rejectError?.error || 'Unable to reject this order right now.');
    }
  };

  return (
    <RiderPageShell maxWidth="max-w-5xl">
      <RiderPageHeader
        title="Dashboard"
        subtitle="Pending requests and ongoing work live together here so riders do not have to bounce between separate pages to stay on top of deliveries."
        sticky
        action={
          <RiderSecondaryButton onClick={() => loadDeliveries()} className="w-auto px-4" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}>
            Refresh
          </RiderSecondaryButton>
        }
      />

      <div className="space-y-6 py-6">
        {!rider?.can_go_online ? (
          <RiderFeedbackState
            type="info"
            title="Verification still blocks delivery work"
            message="Complete rider verification before accepting new orders or moving fully online."
            action={
              <RiderPrimaryButton onClick={() => navigate('/rider/verification-setup')} className="sm:w-auto sm:px-5">
                Open verification
              </RiderPrimaryButton>
            }
          />
        ) : null}

        <RiderSegmentedTabs
          tabs={[
            { ...TABS[0], badge: filteredAvailableOrders.length },
            { ...TABS[1], badge: activeOrders.length },
          ]}
          value={activeTab}
          onChange={(tab) => setSearchParams({ tab })}
        />

        {activeTab === 'pending' ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <RiderSearchField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery('')}
                placeholder="Search pending orders"
              />
              <div className="rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Visible orders</p>
                <p className="mt-2 text-2xl font-bold text-dark">{filteredAvailableOrders.length}</p>
              </div>
            </div>

            {error ? (
              <RiderFeedbackState
                type="error"
                title="Unable to load pending orders"
                message={error}
                action={
                  <RiderPrimaryButton onClick={() => loadDeliveries()} className="sm:w-auto sm:px-5">
                    Try again
                  </RiderPrimaryButton>
                }
              />
            ) : loading && availableOrders.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    <div className="space-y-3">
                      <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                      <div className="flex gap-3 pt-2">
                        <div className="h-11 w-28 animate-pulse rounded-xl bg-gray-100" />
                        <div className="h-11 w-28 animate-pulse rounded-xl bg-gray-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAvailableOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredAvailableOrders.map((order) => (
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
                icon={query ? <Search size={28} /> : <ClipboardList size={28} />}
                title={query ? 'No pending orders match that search' : 'No pending orders right now'}
                description={
                  query
                    ? 'Try a broader search term or clear it to return to the full pending queue.'
                    : 'Stay online and refresh again shortly. New delivery requests will appear here as they arrive.'
                }
                action={
                  query ? (
                    <RiderPrimaryButton onClick={() => setQuery('')} className="sm:w-auto sm:px-5">
                      Clear search
                    </RiderPrimaryButton>
                  ) : (
                    <RiderSecondaryButton onClick={() => loadDeliveries()} className="sm:w-auto sm:px-5">
                      Refresh deliveries
                    </RiderSecondaryButton>
                  )
                }
              />
            )}
          </>
        ) : error ? (
          <RiderFeedbackState
            type="error"
            title="Unable to load ongoing orders"
            message={error}
            action={
              <RiderPrimaryButton onClick={() => loadDeliveries()} className="sm:w-auto sm:px-5">
                Try again
              </RiderPrimaryButton>
            }
          />
        ) : loading && activeOrders.length === 0 ? (
          <div className="space-y-3">
            {[1, 2].map((row) => (
              <div key={row} className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="space-y-3">
                  <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : activeOrders.length > 0 ? (
          <ActiveOrdersList
            orders={activeOrders}
            onOpen={(orderId) => navigate(`/rider/orders/${orderId}`)}
          />
        ) : (
          <RiderEmptyState
            icon={<Truck size={28} />}
            title="No ongoing deliveries"
            description="Once you accept a request it will stay here until it is delivered."
            action={
              <RiderPrimaryButton onClick={() => setSearchParams({ tab: 'pending' })} className="sm:w-auto sm:px-5">
                View pending orders
              </RiderPrimaryButton>
            }
          />
        )}
      </div>
    </RiderPageShell>
  );
};

export default Dashboard;
