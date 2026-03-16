import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Loader2, MapPin, Phone, Clock, AlertCircle, CheckCircle, 
  Package, ChefHat, Truck, Gift, RotateCw, MapPinCheck, Zap
} from 'lucide-react';
import buyerCheckout from '../../../services/buyerCheckout';
import { useTracking } from '../../../context/TrackingContext';
import { getStatusLabel } from '../../../constants/statusLabels';
import { getMessage } from '../../../constants/messages';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';
import liveLocationService from '../../../services/liveLocationService'; // Phase 5

const Tracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { subscribeToOrder, getOrderData } = useTracking();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Fetch order details & subscribe to real-time updates
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await buyerCheckout.getOrderDetails(orderId);
        setOrder(data);
        setError(null);

        // Subscribe to real-time tracking for this order
        if (data && data.status !== 'delivered' && data.status !== 'cancelled') {
          const unsubFunc = subscribeToOrder(orderId, data);
          setUnsubscribe(() => unsubFunc);
        }
      } catch (err) {
        logError(err, { context: 'Tracking.fetchOrder' });
        setError(err.error || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Phase 5: Stop GPS tracking when leaving page
      if (order?.status !== 'delivered' && order?.status !== 'cancelled') {
        liveLocationService.stopTracking();
      }
    };
  }, [orderId, subscribeToOrder]);

  // Poll for live updates from tracking context
  useEffect(() => {
    if (!orderId) return;

    const pollInterval = setInterval(() => {
      const liveData = getOrderData(orderId);
      if (liveData) {
        // Update order with live tracking data
        setOrder(prev => ({
          ...prev,
          ...liveData.order,
          rider_location: liveData.riderLocation,
          eta_seconds: liveData.etaSeconds,
          is_tracking_live: liveData.isLive,
        }));
      }
    }, 500); // Poll every 500ms for minimal latency

    return () => clearInterval(pollInterval);
  }, [orderId, getOrderData]);

  // Phase 5: Manage GPS tracking based on order status
  useEffect(() => {
    if (!order || !orderId) return;

    const isDeliveryActive = ['assigned', 'arrived_at_pickup', 'picked_up'].includes(order.status);

    if (isDeliveryActive && !liveLocationService.isActive()) {
      liveLocationService
        .startTracking(orderId, order.status)
        .catch(err => {
          console.error('Failed to start GPS tracking:', err);
          logError(err, { context: 'Tracking.startGps' });
        });
    } else if (!isDeliveryActive && liveLocationService.isActive()) {
      liveLocationService.stopTracking();
    } else if (isDeliveryActive && liveLocationService.getStatus() === 'tracking') {
      liveLocationService.updateTrackingFrequency(order.status);
    }

    return () => {
      if (liveLocationService.isActive()) {
        liveLocationService.stopTracking();
      }
    };
  }, [order?.status, order?.id, orderId]);

  // Refresh order status
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await buyerCheckout.getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      logError(err, { context: 'Tracking.handleRefresh' });
      setError('Failed to refresh order');
    } finally {
      setRefreshing(false);
    }
  };

  // Format ETA display
  const formatETA = (seconds) => {
    if (!seconds) return '...';
    const mins = Math.ceil(seconds / 60);
    return `~${mins} min${mins !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4 px-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-red-600 font-bold text-center">{error || 'Order not found'}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const status = getStatusLabel(order.status) || getStatusLabel('pending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Order Tracking</h1>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh order status"
          >
            <RotateCw 
              size={20} 
              className={`text-blue-600 transition-transform ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Status Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`${status.bgColor} px-6 py-8 text-center`}>
            <div className="mb-3 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                {order.status === 'delivered' && <Gift size={32} className="text-green-600" />}
                {order.status === 'cancelled' && <AlertCircle size={32} className="text-red-600" />}
                {order.status === 'pending' && <Package size={32} className="text-blue-600" />}
                {order.status === 'preparing' && <ChefHat size={32} className="text-orange-600" />}
                {order.status === 'ready_for_pickup' && <CheckCircle size={32} className="text-green-600" />}
                {['assigned', 'arrived_at_pickup'].includes(order.status) && <Truck size={32} className="text-blue-600" />}
                {['picked_up', 'on_the_way'].includes(order.status) && <Truck size={32} className="text-blue-600" />}
              </div>
            </div>
            <p className={`${status.color} font-bold text-2xl mb-1`}>{status.label}</p>
            <p className="text-sm text-gray-600">Order #{order.id}</p>
            
            {/* Live Tracking Indicator */}
            {order.is_tracking_live && (
              <div className="mt-4 pt-4 border-t border-white/30 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Live Tracking Active</span>
              </div>
            )}
          </div>
        </div>

        {/* ETA & Live Location Section */}
        <div className="grid grid-cols-1 gap-4">
          
          {/* Live ETA Display */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className={`rounded-2xl p-6 shadow-sm border-2 transition-all ${
              order.is_tracking_live 
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    order.is_tracking_live 
                      ? 'bg-green-200 text-green-700' 
                      : 'bg-blue-200 text-blue-700'
                  }`}>
                    <Clock size={28} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${
                      order.is_tracking_live ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {order.is_tracking_live ? 'Live ETA' : 'Estimated Delivery'}
                    </p>
                    <p className={`text-3xl font-bold ${
                      order.is_tracking_live ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {formatETA(order.eta_seconds || order.estimated_time)}
                    </p>
                  </div>
                </div>
                {order.is_tracking_live && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-green-600">Updating</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Rider Location Card */}
          {order.status === 'picked_up' && order.rider_location && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-600" />
                  Rider Location
                </h3>
                {order.is_tracking_live && (
                  <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <Zap size={12} /> LIVE
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Latitude</p>
                  <p className="text-sm font-mono font-bold text-blue-900">
                    {order.rider_location.latitude.toFixed(6)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Longitude</p>
                  <p className="text-sm font-mono font-bold text-blue-900">
                    {order.rider_location.longitude.toFixed(6)}
                  </p>
                </div>
                {order.rider_location.accuracy && (
                  <div className="col-span-2 bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-semibold mb-1">Accuracy</p>
                    <p className="text-sm font-bold text-blue-900">
                      ±{order.rider_location.accuracy.toFixed(1)}m
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Code */}
        {order.confirmation_code && ['picked_up', 'on_the_way', 'delivery_attempted'].includes(order.status) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MapPinCheck size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Delivery Confirmation Code</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Give this code to the delivery rider when they arrive:</p>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 flex items-center justify-center">
              <p className="text-4xl font-bold text-blue-600 tracking-widest">{order.confirmation_code}</p>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">This confirms the delivery and protects your order</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Delivery Progress</h3>
          <div className="space-y-4">
            {[
              { step: 1, label: 'Order Placed', icon: Package },
              { step: 2, label: 'Preparing', icon: ChefHat },
              { step: 3, label: 'Ready for Pickup', icon: CheckCircle },
              { step: 4, label: 'On the Way', icon: Truck },
              { step: 5, label: 'Delivered', icon: Gift },
            ].map((item) => {
              const isActive = status.step >= item.step;
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all shadow-sm ${
                    isActive 
                      ? 'bg-blue-600 text-white scale-110' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold transition-all ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {item.label}
                    </p>
                  </div>
                  {isActive && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Restaurant Info */}
        {order.restaurant && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Restaurant</h3>
            <div className="flex gap-4">
              <img 
                src={order.restaurant.image || 'https://via.placeholder.com/80'} 
                alt={order.restaurant.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{order.restaurant.name}</p>
                <p className="text-sm text-gray-600 mb-3">{order.restaurant.address}</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-2 transition-colors">
                  <Phone size={16} /> Call Restaurant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-3 mb-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.menu_item?.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-medium text-gray-900">₦{order.delivery_fee?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3 mt-3">
              <span className="text-gray-900">Total</span>
              <span className="text-blue-600">₦{order.total_price?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Cancel Order Button */}
        {(order.status === 'pending' || order.status === 'preparing') && (
          <button className="w-full py-3 border-2 border-red-600 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">
            Cancel Order
          </button>
        )}

      </div>
    </div>
  );
};

export default Tracking;