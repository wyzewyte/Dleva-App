import { Clock, User, Loader2, Truck, CheckCircle2 } from 'lucide-react';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';

const OrderCard = ({ order, onStatusChange, onViewDetails }) => {
  

  const statusInfo = getStatusLabel(order.status);

  return (
    <div 
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${statusInfo.borderColor}`}
        onClick={() => onViewDetails(order)}
    >
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="font-bold text-dark text-base sm:text-lg">#{order.id}</span>
        <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-muted bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap">
            <Clock size={14} className="sm:w-4 sm:h-4" />
            <span>{order.time_elapsed || 'Just now'}</span>
        </div>
      </div>

      {/* Customer & Items */}
      <div className="mb-3 space-y-1.5">
         <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mb-1">
            <User size={16} className="sm:w-5 sm:h-5" />
            <span className="font-semibold truncate">{order.buyer}</span>
         </div>
         <p className="text-xs sm:text-sm text-muted line-clamp-1">{order.items?.map(i => i.menu_item).join(', ') || 'Items'}</p>
         <p className="text-xs sm:text-sm text-primary font-bold mt-1">{formatCurrency(order.total_price - order.delivery_fee)}</p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
         
         {/* Stage 1: Pending -> Confirming */}
         {order.status === 'pending' && (
             <button 
                onClick={() => onStatusChange(order.id, 'confirming')}
                className="w-full bg-blue-600 text-white text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center"
             >
                Accept & Cook
             </button>
         )}

         {/* Stage 2: Confirming -> Preparing */}
         {order.status === 'confirming' && (
             <button 
                onClick={() => onStatusChange(order.id, 'preparing')}
                className="w-full bg-blue-500 text-white text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg hover:bg-blue-600 transition-colors min-h-[44px] flex items-center justify-center"
             >
                Start Cooking
             </button>
         )}

         {/* Stage 3: Preparing -> Available for Pickup */}
         {order.status === 'preparing' && (
             <button 
                onClick={() => onStatusChange(order.id, 'available_for_pickup')}
                className="w-full bg-orange-500 text-white text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg hover:bg-orange-600 transition-colors min-h-[44px] flex items-center justify-center"
             >
                Mark Ready
             </button>
         )}

         {/* Stage 4: Available for Pickup (Waiting for Rider) */}
         {(order.status === 'available_for_pickup' || order.status === 'awaiting_rider' || order.status === 'assigned') && (
             <div className="w-full bg-green-50 border border-green-100 text-green-700 text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 animate-pulse min-h-[44px]">
                <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4" /> Waiting for Rider...
             </div>
         )}

         {/* Stage 5: Arrived at Pickup (Rider Here - Click to verify) */}
         {(order.status === 'arrived_at_pickup') && (
             <button 
                onClick={() => onViewDetails(order)}
                className="w-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
             >
                <Truck size={12} /> Verify & Hand Over
             </button>
         )}

         {/* Stage 6: Picked Up (On the Way) */}
         {order.status === 'picked_up' && (
             <div className="w-full bg-purple-50 border border-purple-100 text-purple-700 text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 min-h-[44px]">
                <Truck size={14} className="sm:w-4 sm:h-4" /> On the Way...
             </div>
         )}

         {/* Stage 7: Delivered */}
         {order.status === 'delivered' && (
             <div className="w-full bg-gray-100 text-gray-500 text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 min-h-[44px]">
                <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Delivered
             </div>
         )}

         {/* Stage 8: Cancelled */}
         {order.status === 'cancelled' && (
             <div className="w-full bg-red-100 text-red-600 text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 min-h-[44px]">
                <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Cancelled
             </div>
         )}

      </div>
    </div>
  );
};

export default OrderCard;