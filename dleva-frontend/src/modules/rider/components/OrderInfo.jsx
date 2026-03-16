/**
 * OrderInfo Component
 * Displays order and delivery details
 */

import { Clock, MapPin, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { DELIVERY_STATUS_COLORS, DELIVERY_STATUS_LABELS } from '../constants/deliveryConstants';

const OrderInfo = ({ order, delivery }) => {
  if (!order) return null;

  const items = order.items || [];
  const status = delivery?.status || order?.status;

  // Build color class from constants
  const colorsObj = DELIVERY_STATUS_COLORS[status] || DELIVERY_STATUS_COLORS.assigned;
  const colorClass = `${colorsObj.bg} ${colorsObj.text} border-${colorsObj.border.split('-')[1]}`;
  const statusLabel = DELIVERY_STATUS_LABELS[status] || status;

  return (
    <div className="space-y-4">
      {/* Order ID & Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">Order #{order.id}</h2>
          <p className="text-sm text-muted mt-1">
            <Clock size={14} className="inline mr-1" />
            {new Date(order.time_created).toLocaleString()}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${colorClass}`}>
          {statusLabel}
        </div>
      </div>

      {/* Delivery Route */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* Restaurant */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted font-bold">PICKUP</p>
            <p className="text-sm font-bold text-dark">{order.restaurant_name}</p>
            <p className="text-xs text-muted line-clamp-2">{order.restaurant_address}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="text-primary text-xl">↓</div>
        </div>

        {/* Delivery Address */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted font-bold">DELIVERY</p>
            <p className="text-sm font-bold text-dark">{order.delivery_address}</p>
            <p className="text-xs text-muted">approx {order.distance_km?.toFixed(1)}km away</p>
          </div>
        </div>
      </div>

      {/* Items Summary */}
      {items.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-muted font-bold mb-2 flex items-center gap-1">
            <Package size={14} />
            ITEMS ({items.length})
          </p>
          <div className="space-y-1">
            {items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-sm text-dark flex justify-between">
                <span>{item.name}</span>
                <span className="text-muted">x{item.quantity}</span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-xs text-muted italic mt-2">
                +{items.length - 3} more items
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-bold text-dark">{formatCurrency(order.order_total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Delivery Fee</span>
            <span className="font-bold text-dark">{formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="border-t border-primary/10 pt-2 flex justify-between">
            <span className="font-bold text-dark">Your Earning</span>
            <span className="font-bold text-primary text-lg">
              {formatCurrency(order.estimated_earnings)}
            </span>
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      {order.special_instructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-700 font-bold mb-1">📝 Special Instructions</p>
          <p className="text-sm text-yellow-700">{order.special_instructions}</p>
        </div>
      )}
    </div>
  );
};

export default OrderInfo;
