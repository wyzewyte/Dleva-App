import { MapPin, DollarSign, Clock, User, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const OrderCard = ({ order, onAccept, onReject, isLoading }) => {
  // Defensive checks
  if (!order) return null;

  const getDistanceColor = (km) => {
    const distance = typeof km === 'string' ? parseFloat(km) : km;
    if (distance <= 2) return 'text-green-600';
    if (distance <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEarningsColor = (amount) => {
    const earnings = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (earnings >= 2000) return 'text-green-600';
    if (earnings >= 1000) return 'text-blue-600';
    return 'text-gray-600';
  };

  // Safe property accessors with defaults
  const orderId = order.id || order.order_id || 'N/A';
  const timeCreated = order.time_created || 'Just now';
  const isUrgent = order.is_urgent || false;
  const restaurantName = order.restaurant_name || 'Restaurant';
  const restaurantAddress = order.restaurant_address || 'Address not available';
  const restaurantImage = order.restaurant_image || null;
  const buyerName = order.buyer_name || 'Buyer';
  const itemsCount = order.items_count || 0;
  const orderTotal = order.order_total || 0;
  const distanceKm = typeof order.distance_km === 'string' ? parseFloat(order.distance_km) : (order.distance_km || 0);
  const estimatedTimeMinutes = order.estimated_time_minutes || 30;
  const estimatedEarnings = typeof order.estimated_earnings === 'string' ? parseFloat(order.estimated_earnings) : (order.estimated_earnings || 0);
  const specialInstructions = order.special_instructions || null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 hover:shadow-md transition-shadow">
      
      {/* Header: Order ID & Time */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-dark">Order #{orderId}</h3>
          <p className="text-xs text-muted mt-1">
            <Clock size={12} className="inline mr-1" />
            Placed {timeCreated}
          </p>
        </div>
        {isUrgent && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
            <AlertCircle size={12} />
            Urgent
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <h4 className="font-bold text-dark text-sm mb-1">{restaurantName}</h4>
        <p className="text-xs text-muted line-clamp-2">{restaurantAddress}</p>
      </div>

      {/* Buyer Info */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <User size={14} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted">Buyer</p>
          <p className="text-sm font-bold text-dark">{buyerName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{itemsCount} items</p>
          <p className="text-sm font-bold text-dark">{formatCurrency(orderTotal)}</p>
        </div>
      </div>

      {/* Distance & Pickup/Dropoff Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Distance */}
        <div className="flex items-start gap-2">
          <MapPin size={16} className={`mt-0.5 shrink-0 ${getDistanceColor(distanceKm)}`} />
          <div>
            <p className="text-xs text-muted">Distance</p>
            <p className={`font-bold text-sm ${getDistanceColor(distanceKm)}`}>
              {distanceKm.toFixed(1)} km
            </p>
          </div>
        </div>

        {/* Time to Pickup */}
        <div className="flex items-start gap-2">
          <Clock size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="text-xs text-muted">Est. Pickup</p>
            <p className="font-bold text-sm text-blue-600">{estimatedTimeMinutes}m</p>
          </div>
        </div>
      </div>

      {/* Earnings Estimate */}
      <div className="bg-primary/5 rounded-xl p-4 mb-4 border border-primary/10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-muted mb-1">Your Earning</p>
            <p className={`text-2xl font-bold ${getEarningsColor(estimatedEarnings)}`}>
              {formatCurrency(estimatedEarnings)}
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Instructions (if any) */}
      {specialInstructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-700">
            <span className="font-bold">Note:</span> {specialInstructions}
          </p>
        </div>
      )}
      
      {/* Restaurant Image */}
      {restaurantImage ? (
        <div className="-mx-5 -mb-2">
          <img 
            src={restaurantImage} 
            alt={restaurantName} 
            className="w-full h-32 object-cover rounded-b-2xl"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onReject(orderId)}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 active:scale-95"
        >
          Reject
        </button>
        <button
          onClick={() => onAccept(orderId)}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Accept Order
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
