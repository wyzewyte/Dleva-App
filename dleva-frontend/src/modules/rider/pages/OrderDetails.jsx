import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { useOrder } from '../context/OrderContext';
import { useStatusUpdateListener } from '../hooks/useOrderWebSocket';
import toast from '../../../services/toast';
import { formatCurrency } from '../../../utils/formatters';
import {
  RiderCard,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSecondaryButton,
  RiderStatusBadge,
  RiderTextInput,
} from '../components/ui/RiderPrimitives';

const STATUS_LABELS = {
  assigned: 'Head to pickup',
  arrived_at_pickup: 'Confirm pickup',
  picked_up: 'Start delivery',
  on_the_way: 'On the way',
  delivery_attempted: 'Resolve delivery attempt',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_FLOW = {
  assigned: [{ id: 'arrived_at_pickup', label: 'I arrived at pickup' }],
  arrived_at_pickup: [{ id: 'picked_up', label: 'Order picked up' }],
  picked_up: [{ id: 'on_the_way', label: 'Start trip to buyer' }, { id: 'delivered', label: 'Complete delivery' }],
  on_the_way: [{ id: 'delivery_attempted', label: 'Delivery attempt issue' }, { id: 'delivered', label: 'Complete delivery' }],
  delivery_attempted: [{ id: 'delivered', label: 'Complete delivery' }],
};

const TIMELINE_STEPS = [
  { id: 'assigned', label: 'Assigned' },
  { id: 'arrived_at_pickup', label: 'At pickup' },
  { id: 'picked_up', label: 'Picked up' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'delivered', label: 'Delivered' },
];

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrder, loading, operationLoading, error, actions } = useOrder();
  const { fetchOrderDetails, updateOrderStatus } = actions;
  const [order, setOrder] = useState(location.state?.order || selectedOrder || null);
  const [pin, setPin] = useState('');
  const [actionError, setActionError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const lastStatusEventRef = useRef('');

  const loadOrder = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshOrder = await fetchOrderDetails(orderId);
      setOrder(freshOrder);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrderDetails, orderId]);

  useEffect(() => {
    if (!orderId) return;
    loadOrder().catch(() => {});
  }, [loadOrder, orderId]);

  useEffect(() => {
    if (selectedOrder) {
      setOrder(selectedOrder);
    }
  }, [selectedOrder]);

  const currentStatus = String(order?.status || 'assigned').toLowerCase();
  const nextActions = STATUS_FLOW[currentStatus] || [];

  const handleLiveStatusUpdate = useCallback(
    (data) => {
      if (String(data.order_id) !== String(orderId)) {
        return;
      }

      const incomingStatus = String(data.status || '').toLowerCase();
      const eventKey = [
        data.order_id,
        incomingStatus,
        data.updated_at || data.timestamp || data.event_id || '',
      ].join(':');

      if (eventKey === lastStatusEventRef.current) {
        return;
      }

      lastStatusEventRef.current = eventKey;

      if (!incomingStatus) {
        return;
      }

      if (incomingStatus === currentStatus) {
        return;
      }

      loadOrder().catch(() => {});
    },
    [currentStatus, loadOrder, orderId]
  );

  useStatusUpdateListener(handleLiveStatusUpdate, true);

  const nextTask = useMemo(() => {
    if (currentStatus === 'delivered') {
      return {
        title: 'This delivery is completed',
        description: 'You can return to the active queue or review your delivery history.',
      };
    }
    if (currentStatus === 'cancelled') {
      return {
        title: 'This delivery has been cancelled',
        description: 'No further action is needed here unless support asks for more detail.',
      };
    }
    return {
      title: STATUS_LABELS[currentStatus] || 'Continue delivery',
      description: 'Use the next action below to move the order to the correct stage.',
    };
  }, [currentStatus]);

  const handleStatusUpdate = useCallback(async (status) => {
    setActionError('');
    try {
      const payload = status === 'delivered' ? { delivery_pin: pin } : {};
      await updateOrderStatus(orderId, status, payload);
      toast.success(`Order updated: ${STATUS_LABELS[status] || status}`);
      if (status === 'delivered') {
        setPin('');
      }
      await loadOrder();
    } catch (updateError) {
      setActionError(updateError?.error || 'Unable to update the order right now.');
      toast.error(updateError?.error || 'Unable to update the order right now.');
    }
  }, [loadOrder, orderId, pin, updateOrderStatus]);

  if (loading && !order) {
    return (
      <RiderPageShell maxWidth="max-w-4xl">
        <RiderPageHeader
          title={`Order #${orderId}`}
          subtitle="Everything needed for pickup, drop-off, and confirmation lives here so riders can stay focused on the next real step."
          showBack
          sticky
        />
        <div className="space-y-6 py-6">
          <RiderCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div className="h-6 w-28 animate-pulse rounded bg-gray-100" />
              <div className="h-8 w-56 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            </div>
          </RiderCard>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              {[1, 2].map((card) => (
                <RiderCard key={card} className="p-5 sm:p-6">
                  <div className="space-y-3">
                    <div className="h-6 w-36 animate-pulse rounded bg-gray-100" />
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    ))}
                  </div>
                </RiderCard>
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((card) => (
                <RiderCard key={card} className="p-5">
                  <div className="space-y-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </RiderCard>
              ))}
            </div>
          </div>
        </div>
      </RiderPageShell>
    );
  }

  if (error && !order) {
    return (
      <RiderPageShell maxWidth="max-w-4xl">
        <div className="py-10">
          <RiderFeedbackState
            type="error"
            title="We could not open this order"
            message={error}
            action={
              <RiderPrimaryButton onClick={() => navigate('/rider/deliveries?tab=ongoing')} className="sm:w-auto sm:px-5">
                Back to deliveries
              </RiderPrimaryButton>
            }
          />
        </div>
      </RiderPageShell>
    );
  }

  return (
    <RiderPageShell maxWidth="max-w-4xl">
      <RiderPageHeader
        title={`Order #${order?.id || order?.order_id || orderId}`}
        subtitle="Everything needed for pickup, drop-off, and confirmation lives here so riders can stay focused on the next real step."
        showBack
        sticky
        action={
          <RiderSecondaryButton onClick={() => loadOrder()} className="w-auto px-4" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}>
            Refresh
          </RiderSecondaryButton>
        }
      />

      <div className="space-y-6 py-6">
        {actionError ? (
          <RiderFeedbackState type="error" title="Action could not be completed" message={actionError} />
        ) : null}

        <RiderCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <RiderStatusBadge status={currentStatus}>{STATUS_LABELS[currentStatus] || currentStatus}</RiderStatusBadge>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-dark">{nextTask.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{nextTask.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
              {nextActions.map((action) => (
                <RiderPrimaryButton
                  key={action.id}
                  onClick={() => handleStatusUpdate(action.id)}
                  loading={operationLoading}
                  disabled={action.id === 'delivered' && !pin.trim()}
                  icon={<ArrowRight size={16} />}
                >
                  {action.label}
                </RiderPrimaryButton>
              ))}
            </div>
          </div>

          {nextActions.some((action) => action.id === 'delivered') ? (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Buyer confirmation code</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <RiderTextInput
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter the buyer confirmation code"
                  inputClassName="bg-white text-center text-lg font-bold tracking-[0.25em]"
                />
                <RiderSecondaryButton onClick={() => setPin('')} className="w-full sm:w-auto sm:px-5">
                  Clear
                </RiderSecondaryButton>
              </div>
            </div>
          ) : null}
        </RiderCard>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <RiderCard className="p-5 sm:p-6">
              <h3 className="text-lg font-bold text-dark">Order timeline</h3>
              <div className="mt-5 space-y-4">
                {TIMELINE_STEPS.map((step, index) => {
                  const currentIndex = TIMELINE_STEPS.findIndex((item) => item.id === currentStatus);
                  const isDone = currentIndex >= index || currentStatus === 'delivered';
                  return (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`mt-0.5 h-4 w-4 rounded-full ${isDone ? 'bg-primary' : 'bg-gray-200'}`} />
                        {index < TIMELINE_STEPS.length - 1 ? (
                          <div className={`mt-2 h-10 w-px ${isDone ? 'bg-primary/30' : 'bg-gray-200'}`} />
                        ) : null}
                      </div>
                      <div className="pb-2">
                        <p className={`text-sm font-semibold ${isDone ? 'text-dark' : 'text-muted'}`}>{step.label}</p>
                        <p className="mt-1 text-sm text-muted">
                          {step.id === currentStatus
                            ? 'Current stage'
                            : isDone
                              ? 'Completed'
                              : 'Waiting'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RiderCard>

            {order?.items?.length ? (
              <RiderCard className="p-5 sm:p-6">
                <h3 className="text-lg font-bold text-dark">Order items</h3>
                <div className="mt-4 space-y-3">
                  {order.items.map((item, index) => (
                    <div key={item.id || index} className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-dark">{item.name || item.menu_item_name || 'Order item'}</p>
                        <p className="mt-1 text-sm text-muted">Qty: {item.quantity || 1}</p>
                      </div>
                      <p className="text-sm font-semibold text-dark">{formatCurrency(item.total_price || item.price || 0)}</p>
                    </div>
                  ))}
                </div>
              </RiderCard>
            ) : null}
          </div>

          <div className="space-y-6">
            <RiderCard className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Store size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Pickup</p>
                  <p className="mt-2 text-sm font-semibold text-dark">{order?.restaurant?.name || order?.restaurant_name || 'Restaurant'}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{order?.restaurant?.address || order?.restaurant_address || 'Pickup address unavailable'}</p>
                </div>
              </div>
            </RiderCard>

            <RiderCard className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Buyer</p>
                  <p className="mt-2 text-sm font-semibold text-dark">{order?.buyer?.name || order?.buyer_name || 'Buyer'}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{order?.delivery_address || 'Delivery address unavailable'}</p>
                  {order?.buyer?.phone ? (
                    <a
                      href={`tel:${order.buyer.phone}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-dark transition-colors hover:bg-gray-50"
                    >
                      <Phone size={15} />
                      Call buyer
                    </a>
                  ) : null}
                </div>
              </div>
            </RiderCard>

            <RiderCard className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Delivery summary</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-dark">
                  <span>Distance</span>
                  <span className="font-semibold">{Number(order?.distance_km || 0).toFixed(1)} km</span>
                </div>
                <div className="flex items-center justify-between text-sm text-dark">
                  <span>Rider earning</span>
                  <span className="font-semibold">{formatCurrency(order?.rider_earning || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-dark">
                  <span>Order total</span>
                  <span className="font-semibold">{formatCurrency(order?.order_total || 0)}</span>
                </div>
              </div>
            </RiderCard>

            {order?.special_instructions ? (
              <RiderCard className="border-amber-100 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="mt-0.5 text-amber-700" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Special instructions</p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-700">{order.special_instructions}</p>
                  </div>
                </div>
              </RiderCard>
            ) : null}
          </div>
        </div>
      </div>
    </RiderPageShell>
  );
};

export default OrderDetails;
