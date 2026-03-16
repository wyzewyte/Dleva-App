/**
 * OrderDetails Page
 * Detailed view of a single order with full information and status updates
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertCircle, ArrowLeft, Loader2, MapPin, Phone, Calendar, 
  DollarSign, CheckCircle2, Clock, User 
} from 'lucide-react';
import { useOrder } from '../context/OrderContext';
import { useStatusUpdateListener } from '../hooks/useOrderWebSocket';
import toast from '../../../services/toast';
import { formatCurrency } from '../../../utils/formatters';
import MESSAGES from '../../../constants/messages';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrder, loading, error, actions } = useOrder();
  
  const [order, setOrder] = useState(location.state?.order || selectedOrder || null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Listen for status updates via WebSocket
  useStatusUpdateListener((data) => {
    if (data.order_id === orderId || data.order_id === order?.id) {
      toast.info(`📍 Order status updated to: ${data.status}`);
      // Refresh order details
      if (actions?.fetchOrderDetails) {
        actions.fetchOrderDetails(orderId);
      }
    }
  }, true);

  // Initial load if no order passed via location
  useEffect(() => {
    if (!order) {
      if (actions?.fetchOrderDetails) {
        actions.fetchOrderDetails(orderId);
      }
    }
  }, [orderId]);

  // Sync with OrderContext selectedOrder
  useEffect(() => {
    if (selectedOrder) {
      setOrder(selectedOrder);
    }
  }, [selectedOrder]);

  // Get available status options based on current status
  const getAvailableStatuses = (currentStatus) => {
    const status = currentStatus?.toLowerCase() || 'assigned';
    const statusFlow = {
      'assigned': ['arrived_at_pickup', 'cancel'],
      'arrived_at_pickup': ['picked_up', 'cancel'],
      'picked_up': ['delivery_attempted', 'delivered', 'cancel'],
      'delivery_attempted': ['delivered', 'cancel'],
      'delivered': [],
      'cancelled': [],
    };
    return statusFlow[status] || [];
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      setStatusError('Please select a status');
      return;
    }

    // If trying to mark as delivered, show PIN verification modal first
    if (selectedStatus === 'delivered') {
      setShowStatusModal(false);
      setShowPinModal(true);
      setPinError('');
      setEnteredPin('');
      return;
    }

    setUpdatingStatus(true);
    setStatusError('');
    try {
      await actions.updateOrderStatus(orderId, selectedStatus);
      toast.success(`Order status updated to ${selectedStatus}`);
      
      // Refresh order details to sync frontend state with backend
      if (actions?.fetchOrderDetails) {
        await actions.fetchOrderDetails(orderId);
      }
      
      // Close modal after refresh completes
      setShowStatusModal(false);
      setSelectedStatus('');
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setStatusError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle code verification and delivery completion
  const handleVerifyCodeAndDeliver = async () => {
    if (!enteredPin.trim()) {
      setPinError('Please enter the confirmation code');
      return;
    }

    setUpdatingStatus(true);
    setPinError('');
    try {
      await actions.updateOrderStatus(orderId, 'delivered', { delivery_pin: enteredPin });
      toast.success('Order delivered successfully! Earning credited to wallet.');
      
      // Refresh order details
      if (actions?.fetchOrderDetails) {
        await actions.fetchOrderDetails(orderId);
      }
      
      setShowPinModal(false);
      setEnteredPin('');
    } catch (err) {
      const errorMsg = err.error || MESSAGES.ERROR.SOMETHING_WRONG;
      setPinError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colorMap = {
      'accepted': 'bg-blue-50 border-blue-200 text-blue-700',
      'arrived_at_pickup': 'bg-purple-50 border-purple-200 text-purple-700',
      'picked_up': 'bg-indigo-50 border-indigo-200 text-indigo-700',
      'on_the_way': 'bg-orange-50 border-orange-200 text-orange-700',
      'delivery_attempted': 'bg-yellow-50 border-yellow-200 text-yellow-700',
      'delivered': 'bg-green-50 border-green-200 text-green-700',
      'cancelled': 'bg-red-50 border-red-200 text-red-700',
    };
    return colorMap[status?.toLowerCase()] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'accepted': 'Accepted',
      'arrived_at_pickup': 'Arrived at Pickup',
      'picked_up': 'Picked Up',
      'on_the_way': 'On the Way',
      'delivery_attempted': 'Delivery Attempted',
      'delivered': 'Delivered',
      'released': 'Released',
      'cancelled': 'Cancelled',
    };
    return labels[status?.toLowerCase()] || status || 'Pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-red-200">
          <AlertCircle size={32} className="text-red-600 mx-auto mb-4" />
          <p className="text-red-700 font-bold mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = order.status || 'accepted';
  const availableStatuses = getAvailableStatuses(currentStatus);
  const orderId_display = order.id || order.order_id || 'N/A';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-dark">Order Details</h1>
            <p className="text-xs text-gray-600">Order #{orderId_display}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Status Error */}
        {statusError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Error</p>
              <p>{statusError}</p>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-3">Current Status</h2>
          <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border ${getStatusColor(currentStatus)}`}>
            {getStatusLabel(currentStatus)}
          </div>
          
          {availableStatuses.length > 0 && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="mt-4 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm"
            >
              Update Status
            </button>
          )}
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-4">Order Information</h2>
          
          <div className="space-y-4">
            {/* Restaurant */}
            <div>
              <p className="text-xs text-gray-600 font-bold mb-1">Restaurant</p>
              <div>
                <p className="text-sm font-bold text-dark">{order.restaurant?.name || order.restaurant_name || 'N/A'}</p>
                {order.restaurant?.address && (
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin size={14} className="text-orange-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600">{order.restaurant.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <User size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-bold mb-1">Delivery To (Buyer)</p>
                  <p className="text-sm font-bold text-dark mb-2">{order.buyer?.name || order.buyer_name || 'N/A'}</p>
                  {order.buyer?.phone && (
                    <a href={`tel:${order.buyer.phone}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors">
                      <Phone size={14} />
                      Call Buyer
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-bold mb-1">Delivery Address</p>
                  <p className="text-sm text-dark">{order.delivery_address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Items Count */}
            <div className="pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-600 font-bold mb-1">Items</p>
                <p className="text-sm font-bold text-dark">{order.items_count || 0} items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-4">Delivery Information</h2>
          
          <div className="space-y-4">
            {/* Distance */}
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                <p className="text-xs text-gray-600 font-bold">Distance</p>
              </div>
              <p className="text-sm font-bold text-dark mt-1">{order.distance_km?.toFixed(1) || '0'} km</p>
            </div>



            {/* Picked Up Time */}
            {order.picked_up_at && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <p className="text-xs text-gray-600 font-bold">Picked Up</p>
                </div>
                <p className="text-sm text-dark mt-1">{new Date(order.picked_up_at).toLocaleString()}</p>
              </div>
            )}

            {/* Delivered Time */}
            {order.delivered_at && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <p className="text-xs text-gray-600 font-bold">Delivered</p>
                </div>
                <p className="text-sm text-dark mt-1">{new Date(order.delivered_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Earnings Information */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-green-700 uppercase mb-2">Your Earnings</h2>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(order.rider_earning || 0)}</p>
        </div>

        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-yellow-700 mb-2">Special Instructions</h3>
            <p className="text-sm text-yellow-700">{order.special_instructions}</p>
          </div>
        )}

        {/* Order Items Section */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-600 uppercase mb-4">Order Items</h2>
            
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={item.id || idx} className="flex items-start justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-dark">{item.name}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-lg font-bold text-dark mb-4">Update Order Status</h2>
              
              <div className="space-y-3 mb-6">
                {availableStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`w-full p-4 border-2 rounded-lg text-left font-bold transition-all ${
                      selectedStatus === status
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-dark hover:border-gray-300'
                    }`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedStatus('');
                    setStatusError('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-dark font-bold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || !selectedStatus}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-in zoom-in">
            <h2 className="text-lg font-bold text-dark mb-2">Verify Confirmation Code</h2>
            <p className="text-sm text-gray-600 mb-4">Ask the buyer for the confirmation code to complete delivery.</p>
            
            {pinError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{pinError}</p>
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 4-digit code"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-widest font-bold focus:border-blue-600 focus:outline-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setEnteredPin('');
                  setPinError('');
                  setShowStatusModal(true);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-dark font-bold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCodeAndDeliver}
                disabled={updatingStatus || !enteredPin}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Complete Delivery'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
