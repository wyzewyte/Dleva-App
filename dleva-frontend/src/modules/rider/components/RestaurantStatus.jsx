/**
 * RestaurantStatus Component
 * Displays restaurant and preparation status
 */

import { Clock, MapPin, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { DELIVERY_STATUSES } from '../constants/deliveryConstants';

const RestaurantStatus = ({ restaurant, order, delivery, isLoading, onArrivedAtPickup, onConfirmPickup }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!restaurant || !order) return null;

  const status = delivery?.status || order?.status;
  const isAtPickup = [DELIVERY_STATUSES.ARRIVED_AT_PICKUP, DELIVERY_STATUSES.PICKED_UP].includes(status);
  const hasPickedUp = status === DELIVERY_STATUSES.PICKED_UP;

  const estimatedReadyTime = order.preparation_time_minutes || 20;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200 p-4 space-y-4">
      {/* Restaurant Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">🏪</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-dark">{restaurant.name}</h3>
          <p className="text-xs text-muted flex items-center gap-1">
            <MapPin size={12} />
            {restaurant.distance?.toFixed(1) || 0}km away
          </p>
        </div>
      </div>

      {/* Preparation Status */}
      <div className="bg-white rounded-lg p-3 border border-orange-100 space-y-2">
        <div className="flex items-start gap-2">
          <Clock size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted font-bold">Preparation Status</p>
            <p className="text-sm text-dark font-bold">Est. {estimatedReadyTime} mins</p>
            {restaurant.status === 'preparing' && (
              <p className="text-xs text-orange-600 mt-1">⏳ Order is being prepared</p>
            )}
            {restaurant.status === 'ready' && (
              <p className="text-xs text-green-600 mt-1 font-bold">✓ Order is ready!</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions Based on Status */}
      <div className="space-y-2">
        {!isAtPickup && (
          <button
            onClick={onArrivedAtPickup}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <MapPin size={16} />
            <span>Arrived at Pickup</span>
          </button>
        )}

        {isAtPickup && !hasPickedUp && (
          <div className="space-y-2">
            {showConfirm ? (
              <button
                onClick={onConfirmPickup}
                disabled={isLoading}
                className="w-full bg-success hover:bg-success/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <CheckCircle2 size={16} />
                <span>Confirm Items Received</span>
              </button>
            ) : (
              <>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <p className="text-sm font-bold text-dark mb-2">📦 Verify your pickup:</p>
                  <div className="space-y-1 text-sm text-dark">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span>All items present</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span>Items in good condition</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span>No special requests missing</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={isLoading}
                  className="w-full bg-success hover:bg-success/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  <CheckCircle2 size={16} />
                  <span>Ready to Pickup</span>
                </button>
              </>
            )}
          </div>
        )}

        {hasPickedUp && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-700">✓ Picked Up</p>
              <p className="text-xs text-green-600">Ready to deliver</p>
            </div>
          </div>
        )}
      </div>

      {/* Contact Restaurant */}
      {restaurant.phone_number && (
        <a
          href={`tel:${restaurant.phone_number}`}
          className="block w-full border-2 border-orange-200 hover:bg-orange-50 text-orange-600 font-bold py-2 rounded-lg text-center transition-colors text-sm"
        >
          📞 Call Restaurant
        </a>
      )}

      {/* Important Note */}
      {!hasPickedUp && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex gap-2 text-xs">
          <AlertCircle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-700">Wait for order to be ready before confirming pickup</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantStatus;
