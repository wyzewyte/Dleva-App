/**
 * CustomerContact Component
 * Displays customer info and contact options
 */

import { Phone, MessageCircle, User, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

const CustomerContact = ({ customer, order, onCall, onMessage, isLoading }) => {
  const [showingPhone, setShowingPhone] = useState(false);

  if (!customer) return null;

  const handleCallClick = () => {
    setShowingPhone(true);
    if (customer.phone_number && onCall) {
      onCall(customer.phone_number);
    }
  };

  const handleMessageClick = () => {
    if (customer.phone_number && onMessage) {
      onMessage(customer.phone_number);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-4 space-y-4">
      {/* Customer Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <User size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-dark">{customer.name || 'Customer'}</h3>
          {customer.rating && (
            <p className="text-xs text-muted">⭐ {customer.rating.toFixed(1)} rating</p>
          )}
        </div>
      </div>

      {/* Delivery Notes */}
      {order?.special_instructions && (
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-muted font-bold mb-1 flex items-center gap-1">
            📌 Delivery Notes
          </p>
          <p className="text-sm text-dark">{order.special_instructions}</p>
        </div>
      )}

      {/* Estimated Arrival */}
      {order?.estimated_time_minutes && (
        <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
          <Clock size={16} className="text-primary" />
          <div>
            <p className="text-xs text-muted font-bold">Estimated Arrival</p>
            <p className="text-sm font-bold text-dark">~{order.estimated_time_minutes} minutes</p>
          </div>
        </div>
      )}

      {/* Contact Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCallClick}
          disabled={isLoading || !customer.phone_number}
          className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          <Phone size={16} />
          <span className="text-sm">Call</span>
        </button>
        <button
          onClick={handleMessageClick}
          disabled={isLoading || !customer.phone_number}
          className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-200 text-primary font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          <MessageCircle size={16} />
          <span className="text-sm">Message</span>
        </button>
      </div>

      {/* Delivery Address */}
      {order?.delivery_address && (
        <div className="bg-white rounded-lg p-3 border border-gray-100 space-y-2">
          <p className="text-xs text-muted font-bold flex items-center gap-1">
            <MapPin size={14} />
            DELIVERY ADDRESS
          </p>
          <p className="text-sm text-dark">{order.delivery_address}</p>
          {order?.delivery_instructions && (
            <p className="text-xs text-muted italic border-t border-gray-100 pt-2">
              {order.delivery_instructions}
            </p>
          )}
        </div>
      )}

      {/* Safety Reminder */}
      <div className="text-xs text-muted bg-white/50 rounded-lg p-2 text-center">
        💡 Confirm payment terms before completing delivery
      </div>
    </div>
  );
};

export default CustomerContact;
