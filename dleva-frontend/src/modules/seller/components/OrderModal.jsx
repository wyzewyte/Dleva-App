import { X, Clock, User, MapPin, Phone, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';

const OrderModal = ({ order, isOpen, onClose, onStatusChange }) => {
  if (!isOpen || !order) return null;

  // LOGIC: Is the order active? (Not delivered/cancelled)
  const isActive = !['delivered', 'cancelled'].includes(order.status);

  const copyAddress = () => {
    if (!isActive) return;
    navigator.clipboard.writeText(order.customer_address || '');
    alert("Address copied to clipboard!");
  };

  // --- ACTIONS LOGIC ---
  const renderActions = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2 sm:gap-3">
             <button 
                className="flex-1 py-2 sm:py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm sm:text-base hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                onClick={() => { 
                    if(window.confirm("Reject this order?")) {
                        onStatusChange(order.id, 'cancelled'); 
                        onClose();
                    }
                }}
             >
                <X size={16} className="sm:w-5 sm:h-5" /> Reject
             </button>
             
             <button 
                className="flex-1 py-2 sm:py-3 rounded-xl bg-blue-600 text-white font-bold text-sm sm:text-base hover:bg-blue-700 shadow-md active:scale-95 transition-all min-h-[44px] flex items-center justify-center"
                onClick={() => { onStatusChange(order.id, 'confirming'); onClose(); }}
             >
                Accept & Cook
             </button>
          </div>
        );
      case 'confirming':
        return (
          <button 
            className="w-full py-2 sm:py-3 rounded-xl bg-blue-500 text-white font-bold text-sm sm:text-base hover:bg-blue-600 shadow-md active:scale-95 transition-all min-h-[44px] flex items-center justify-center"
            onClick={() => { onStatusChange(order.id, 'preparing'); onClose(); }}
          >
            Start Cooking
          </button>
        );
      case 'preparing':
        return (
          <button 
            className="w-full py-2 sm:py-3 rounded-xl bg-orange-500 text-white font-bold text-sm sm:text-base hover:bg-orange-600 shadow-md active:scale-95 transition-all min-h-[44px] flex items-center justify-center"
            onClick={() => { onStatusChange(order.id, 'available_for_pickup'); onClose(); }}
          >
            Mark Ready for Pickup
          </button>
        );
      case 'available_for_pickup':
      case 'awaiting_rider':
      case 'assigned':
        return (
          <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-100 text-center">
             <p className="text-green-800 font-medium text-sm sm:text-base mb-1">Finding Best Rider...</p>
             <p className="text-xs sm:text-sm text-green-600">Searching nearby riders for fastest delivery</p>
          </div>
        );
      case 'arrived_at_pickup':
        return (
          <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100 text-center">
             <p className="text-blue-800 font-medium text-sm sm:text-base mb-1">Rider Here</p>
             <p className="text-xs sm:text-sm text-blue-600">Rider has arrived. Hand them the food and they'll confirm pickup.</p>
          </div>
        );
      case 'picked_up':
        return (
          <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-100 text-center">
             <p className="text-purple-800 font-medium text-sm sm:text-base mb-1">On the Way...</p>
             <p className="text-xs sm:text-sm text-purple-600">Rider is delivering to customer now</p>
          </div>
        );
      case 'delivered':
        return (
            <div className="bg-green-100 p-3 sm:p-4 rounded-xl border border-green-200 text-center flex items-center justify-center gap-2 text-green-700 font-medium text-sm sm:text-base min-h-[44px]">
                <CheckCircle2 size={16} className="sm:w-5 sm:h-5" />
                Order Delivered
            </div>
        );
      case 'cancelled':
        return (
            <div className="bg-red-100 p-3 sm:p-4 rounded-xl border border-red-200 text-center flex items-center justify-center gap-2 text-red-700 font-medium text-sm sm:text-base min-h-[44px]">
                <X size={16} className="sm:w-5 sm:h-5" />
                Order Cancelled
            </div>
        );
      default:
        return null; 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="bg-white w-full max-w-lg rounded-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100 flex justify-between items-start sm:items-center bg-gray-50 rounded-t-2xl gap-3">
            <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-dark">Order #{order.id}</h2>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted mt-1 flex-wrap">
                    <Clock size={14} className="flex-shrink-0" /> 
                    <span>Placed {new Date(order.created_at).toLocaleString()}</span>
                    {!isActive && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">ARCHIVED</span>}
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm flex-shrink-0">
                <X size={20} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto space-y-4 sm:space-y-6">
            
            {/* --- 1. BUYER INFORMATION --- */}
            <div className="flex flex-col gap-3 p-3 sm:p-4 md:p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="bg-blue-100 p-2 sm:p-2.5 rounded-full text-blue-600 flex-shrink-0">
                        <User size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-dark text-sm sm:text-base">{order.customer_name || 'Unknown'}</h4>
                        <p className="text-xs sm:text-sm text-muted">Verified Customer</p>
                    </div>
                </div>
                <div className="border-t border-blue-100 my-1"></div>
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-2">
                         <div className="flex gap-2 sm:gap-3 min-w-0 flex-1">
                            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0 sm:w-5 sm:h-5" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-500 uppercase">Delivery Address</p>
                                <p className="text-xs sm:text-sm text-dark font-medium leading-tight break-words">{order.customer_address || 'N/A'}</p>
                            </div>
                         </div>
                         {isActive && (
                            <button onClick={copyAddress} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded flex-shrink-0">
                                <Copy size={16} />
                            </button>
                         )}
                    </div>
                    <div className="flex gap-2 sm:gap-3 min-w-0">
                        <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0 sm:w-5 sm:h-5" />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-500 uppercase">Phone Contact</p>
                            {isActive ? (
                                <a href={`tel:${order.customer_phone}`} className="text-xs sm:text-sm text-primary font-bold hover:underline break-words">
                                    {order.customer_phone || 'N/A'}
                                </a>
                            ) : (
                                <span className="text-xs sm:text-sm text-gray-400 font-medium select-none">
                                    {order.customer_phone?.slice(0, 4) || '****'}**** (Hidden)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 2. RIDER INFORMATION --- */}
            {['available_for_pickup', 'awaiting_rider', 'assigned', 'arrived_at_pickup', 'picked_up', 'delivered'].includes(order.status) && (
                <div>
                    {order.rider ? (
                        // ✅ ACTUAL ASSIGNED RIDER
                        <div className={`flex flex-col gap-3 p-3 sm:p-4 md:p-6 rounded-xl border ${isActive ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50 border-gray-100 grayscale'}`}>
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs sm:text-sm flex-shrink-0">
                                        {order.rider.first_name?.[0]}{order.rider.last_name?.[0] || ''}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-dark text-sm sm:text-base">
                                            {order.rider.full_name || `${order.rider.first_name} ${order.rider.last_name}`}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-muted">Dleva Rider • {order.rider.rating || 4.8} ⭐</p>
                                        <p className="text-xs text-purple-600 font-medium mt-0.5">
                                            {order.rider.vehicle_type && `${order.rider.vehicle_type.charAt(0).toUpperCase() + order.rider.vehicle_type.slice(1)} • `}
                                            Plate: {order.rider.vehicle_plate_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                
                                {isActive && order.rider.phone_number && (
                                    <a href={`tel:${order.rider.phone_number}`} className="bg-white p-2 rounded-full border border-purple-200 text-purple-600 hover:bg-purple-100 shadow-sm flex-shrink-0">
                                        <Phone size={16} className="sm:w-5 sm:h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : ['available_for_pickup', 'awaiting_rider', 'assigned'].includes(order.status) ? (
                        // ⏳ WAITING FOR RIDER ASSIGNMENT
                        <div className="bg-yellow-50 p-3 sm:p-4 md:p-6 rounded-xl border border-yellow-100 flex items-start gap-2 sm:gap-3">
                            <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0 sm:w-5 sm:h-5" />
                            <div>
                                <p className="text-yellow-800 font-bold text-sm sm:text-base">Waiting for Rider...</p>
                                <p className="text-xs sm:text-sm text-yellow-700 mt-1">Finding nearby riders. This usually takes 30 seconds.</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* --- 3. ORDER ITEMS --- */}
            <div>
                <h3 className="font-bold text-gray-500 text-xs uppercase mb-3">Items to Prepare</h3>
                <div className="space-y-2 sm:space-y-3">
                    {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start pb-3 border-b border-gray-50 gap-2">
                            <div className="flex gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center font-bold text-xs text-gray-500 flex-shrink-0">{item.quantity}x</div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-dark text-sm sm:text-base">{item.menu_item}</p>
                                    <p className="text-xs sm:text-sm text-muted">{formatCurrency(item.price)}</p>
                                </div>
                            </div>
                            <span className="font-bold text-dark text-sm sm:text-base flex-shrink-0">{formatCurrency(item.subtotal)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted">Food Total</span>
                    <span className="font-semibold text-dark">{formatCurrency(order.total_price - order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm border-b border-gray-50 pb-2">
                    <span className="text-muted">Delivery Fee</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-dark text-sm sm:text-base">Total Amount</span>
                    <span className="text-xl sm:text-2xl font-bold text-dark">{formatCurrency(order.total_price)}</span>
                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-gray-100 bg-white rounded-b-2xl">
            {renderActions()}
        </div>

      </div>
    </div>
  );
};

export default OrderModal;