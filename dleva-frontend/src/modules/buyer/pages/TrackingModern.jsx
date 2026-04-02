import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, MapPin, Navigation, RefreshCw, ShieldCheck, Store, Truck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import buyerCheckout from '../../../services/buyerCheckout';
import { useTracking } from '../../../context/TrackingContext';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';
import liveLocationService from '../../../services/liveLocationService';
import {
  BuyerCard,
  BuyerFeedbackState,
  BuyerPageHeader,
  BuyerPrimaryButton,
  BuyerStatusBadge,
} from '../components/ui/BuyerPrimitives';

const TRACK_STEPS = [
  { id: 'placed', title: 'Order placed', description: 'Your order has been received.' },
  { id: 'preparing', title: 'Preparing', description: 'The restaurant is preparing your food.' },
  { id: 'ready', title: 'Ready for pickup', description: 'The order is waiting for rider assignment or pickup.' },
  { id: 'rider', title: 'Rider assigned', description: 'A rider is on the delivery flow for this order.' },
  { id: 'transit', title: 'On the way', description: 'Your order is moving toward your delivery address.' },
  { id: 'done', title: 'Delivered', description: 'The order has been completed successfully.' },
];

const getTrackStage = (status) => {
  if (['delivered'].includes(status)) return 'done';
  if (['picked_up', 'on_the_way', 'delivery_attempted'].includes(status)) return 'transit';
  if (['assigned', 'arrived_at_pickup'].includes(status)) return 'rider';
  if (['available_for_pickup', 'awaiting_rider'].includes(status)) return 'ready';
  if (['preparing'].includes(status)) return 'preparing';
  return 'placed';
};

const TrackingModern = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { subscribeToOrder, getOrderData } = useTracking();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await buyerCheckout.getOrderDetails(orderId);
        setOrder(data);
        setError(null);

        if (data && !['delivered', 'cancelled'].includes(data.status)) {
          unsubscribeRef.current = subscribeToOrder(orderId, data);
        }
      } catch (err) {
        logError(err, { context: 'TrackingModern.fetchOrder' });
        setError(err.error || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (liveLocationService.isActive()) liveLocationService.stopTracking();
    };
  }, [orderId, subscribeToOrder]);

  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(() => {
      const liveData = getOrderData(orderId);
      if (liveData?.order) {
        setOrder((previous) => ({
          ...previous,
          ...liveData.order,
          rider_location: liveData.riderLocation || previous?.rider_location,
          connection_status: liveData.connectionStatus,
        }));
      }
    }, 600);

    return () => clearInterval(interval);
  }, [getOrderData, orderId]);

  useEffect(() => {
    if (!order || !orderId) return;

    const isDeliveryActive = ['assigned', 'arrived_at_pickup', 'picked_up', 'on_the_way'].includes(order.status);

    if (isDeliveryActive && !liveLocationService.isActive()) {
      liveLocationService.startTracking(orderId, order.status).catch((err) => {
        logError(err, { context: 'TrackingModern.startGps' });
      });
    } else if (!isDeliveryActive && liveLocationService.isActive()) {
      liveLocationService.stopTracking();
    }

    return () => {
      if (liveLocationService.isActive()) liveLocationService.stopTracking();
    };
  }, [order, orderId]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await buyerCheckout.getOrderDetails(orderId);
      setOrder(data);
      setError(null);
    } catch (err) {
      logError(err, { context: 'TrackingModern.handleRefresh' });
      setError(err.error || 'Failed to refresh this order');
    } finally {
      setRefreshing(false);
    }
  };

  const statusInfo = order ? getStatusLabel(order.status) || getStatusLabel('pending') : null;
  const currentStage = getTrackStage(order?.status);
  const currentStageIndex = TRACK_STEPS.findIndex((step) => step.id === currentStage);
  const etaLabel =
    order?.eta_seconds && Number(order.eta_seconds) > 0
      ? `${Math.ceil(Number(order.eta_seconds) / 60)} min away`
      : order?.status === 'delivered'
        ? 'Delivered'
        : 'Tracking live';

  const totals = useMemo(() => {
    const subtotal = (order?.items || []).reduce((sum, item) => {
      const price = Number(item.price || item.menu_item?.price || 0);
      const quantity = Number(item.quantity || 1);
      return sum + price * quantity;
    }, 0);

    return {
      subtotal,
      deliveryFee: Number(order?.delivery_fee || 0),
      total: Number(order?.total_price || subtotal),
    };
  }, [order]);

  if (loading) {
    return (
      <BuyerFeedbackState
        type="loading"
        title="Loading your order"
        message="Please wait while we pull in the latest order updates."
      />
    );
  }

  if (error || !order) {
    return (
      <BuyerFeedbackState
        type="error"
        title="Could not load tracking"
        message={error || 'Order not found'}
        action={<BuyerPrimaryButton onClick={() => navigate('/orders')}>Back to Orders</BuyerPrimaryButton>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      <BuyerPageHeader
        title="Track Order"
        showBack
        action={
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-surface text-dark transition-colors hover:bg-gray-50"
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        }
      />

      <BuyerCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Restaurant</p>
            <h2 className="mt-1 text-xl font-semibold text-dark">{order.restaurant_name || 'Restaurant'}</h2>
            <p className="mt-2 text-sm text-muted">
              {(order.items || []).length} item{(order.items || []).length === 1 ? '' : 's'} in this order
            </p>
          </div>
          <BuyerStatusBadge status={order.status}>{statusInfo?.label || 'Pending'}</BuyerStatusBadge>
        </div>
      </BuyerCard>

      <BuyerCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current status</p>
            <h3 className="mt-1 text-2xl font-semibold text-dark">{statusInfo?.label || 'Pending'}</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {statusInfo?.message || 'We are updating your order progress in real time.'}
            </p>
          </div>

          <div className="rounded-[18px] border border-gray-200 bg-gray-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">ETA</p>
            <p className="mt-1 text-lg font-semibold text-dark">{etaLabel}</p>
            {order.connection_status === 'connected' ? (
              <p className="mt-1 text-xs text-emerald-600">Live updates connected</p>
            ) : null}
          </div>
        </div>
      </BuyerCard>

      <BuyerCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Truck size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-dark">Order progress</h3>
        </div>

        <div className="space-y-5">
          {TRACK_STEPS.map((step, index) => {
            const isCompleted = index <= currentStageIndex;
            const isActive = index === currentStageIndex;

            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                      isCompleted
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 bg-white text-muted'
                    }`}
                  >
                    {index + 1}
                  </span>
                  {index !== TRACK_STEPS.length - 1 ? (
                    <span className={`mt-2 block h-12 w-px ${isCompleted ? 'bg-primary/30' : 'bg-gray-200'}`} />
                  ) : null}
                </div>

                <div className="pb-2">
                  <p className={`text-sm font-semibold ${isActive ? 'text-dark' : 'text-muted'}`}>{step.title}</p>
                  <p className="mt-1 text-sm text-muted">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </BuyerCard>

      {order.confirmation_code && ['picked_up', 'on_the_way', 'delivery_attempted'].includes(order.status) ? (
        <BuyerCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-dark">Delivery confirmation code</h3>
          </div>
          <p className="text-sm text-muted">Share this code with the rider when the order gets to you.</p>
          <div className="mt-4 inline-flex rounded-[18px] border border-primary/15 bg-primary/5 px-5 py-3">
            <span className="text-2xl font-bold tracking-[0.5em] text-primary">{order.confirmation_code}</span>
          </div>
        </BuyerCard>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <BuyerCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-dark">Delivery details</h3>
          </div>
          <p className="text-sm leading-relaxed text-dark">{order.delivery_address || 'No delivery address provided.'}</p>
          {(order.delivery_latitude || order.delivery_longitude) ? (
            <p className="mt-3 text-xs text-muted">
              {order.delivery_latitude ? `Lat ${Number(order.delivery_latitude).toFixed(5)}` : ''}
              {order.delivery_latitude && order.delivery_longitude ? ' • ' : ''}
              {order.delivery_longitude ? `Lng ${Number(order.delivery_longitude).toFixed(5)}` : ''}
            </p>
          ) : null}
        </BuyerCard>

        {order.rider_location ? (
          <BuyerCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Navigation size={18} className="text-primary" />
              <h3 className="text-lg font-semibold text-dark">Live rider location</h3>
            </div>
            <div className="space-y-2 text-sm text-dark">
              <p>Latitude: {Number(order.rider_location.latitude).toFixed(5)}</p>
              <p>Longitude: {Number(order.rider_location.longitude).toFixed(5)}</p>
              {order.rider_location.accuracy ? (
                <p className="text-muted">Accuracy: ±{Number(order.rider_location.accuracy).toFixed(1)}m</p>
              ) : null}
            </div>
          </BuyerCard>
        ) : null}
      </div>

      <BuyerCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Store size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-dark">Order summary</h3>
        </div>

        <div className="space-y-3">
          {(order.items || []).map((item, index) => {
            const price = Number(item.price || item.menu_item?.price || 0);
            const quantity = Number(item.quantity || 1);
            const itemSubtotal = price * quantity;
            return (
              <div key={`${order.id}-item-${index}`} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-dark">{item.menu_item?.name || 'Item'}</p>
                  <p className="mt-1 text-xs text-muted">Qty {quantity}</p>
                </div>
                <p className="text-sm font-semibold text-dark">{formatCurrency(itemSubtotal)}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>Delivery fee</span>
            <span>{formatCurrency(totals.deliveryFee)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-dark">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </BuyerCard>
    </div>
  );
};

export default TrackingModern;
