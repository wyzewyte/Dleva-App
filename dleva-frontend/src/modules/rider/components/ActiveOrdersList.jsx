import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

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
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
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

        return (
          <div key={orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-sm">Order #{orderId}</p>
                <p className="text-xs text-gray-600 truncate">{restaurantName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{distanceKm.toFixed(1)} km</p>
                <p className="text-sm font-bold">{formatCurrency(riderEarning)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0 flex-1">
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate max-w-xs" title={order.delivery_address || order.dropoff_location || ''}>
                  {order.delivery_address || order.dropoff_location || ''}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    // Navigate to order details page and pass the order data
                    onOpen(orderId);
                  }}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveOrdersList;
