/**
 * ActiveOrders Page
 * Displays list of active/in-progress deliveries
 * Allows rider to view details and update status
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, MapPin, Clock, RefreshCw } from 'lucide-react';
import { useOrder } from '../context/OrderContext';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import ActiveOrdersList from '../components/ActiveOrdersList';
import toast from '../../../services/toast';
import { formatCurrency } from '../../../utils/formatters';
import MESSAGES from '../../../constants/messages';

const ActiveOrders = () => {
  const navigate = useNavigate();
  const { activeOrders, loading, error, actions } = useOrder();
  const [refreshing, setRefreshing] = useState(false);

  // WebSocket for real-time status updates
  useOrderWebSocket({
    autoConnect: true,
    autoRefreshNewOrder: false,
    autoRefreshStatusUpdate: true,
    onStatusUpdate: (data) => {
      toast.info(`📍 Order ${data.order_id}: ${data.status}`, {
        type: 'info',
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await actions.fetchActiveOrders();
      toast.success('Orders refreshed', {
        type: 'success',
        duration: 2000,
      });
    } catch (err) {
      toast.error('Failed to refresh orders', {
        type: 'error',
        duration: 4000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Only refresh on focus - no background polling
  useEffect(() => {
    let hasRefreshedAfterFocus = false;

    const handleFocus = async () => {
      if (!hasRefreshedAfterFocus) {
        hasRefreshedAfterFocus = true;
        try {
          await actions.fetchActiveOrders().catch(() => {});
        } catch (err) {
          // Silently fail
        }
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [actions]);

  // Get status color and label
  const getStatusColor = (status) => {
    const statusMap = {
      'accepted': 'bg-blue-50 border-blue-200 text-blue-700',
      'picked_up': 'bg-purple-50 border-purple-200 text-purple-700',
      'on_the_way': 'bg-orange-50 border-orange-200 text-orange-700',
      'delivery_attempted': 'bg-red-50 border-red-200 text-red-700',
      'arrived': 'bg-green-50 border-green-200 text-green-700',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'accepted': 'Accepted',
      'picked_up': 'Picked Up',
      'on_the_way': 'On the Way',
      'delivery_attempted': 'Attempted',
      'arrived': 'Arrived',
    };
    return statusLabels[status?.toLowerCase()] || status || 'Pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-2 sm:py-3 lg:py-4 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-dark sm:w-5 sm:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-dark text-base sm:text-lg">Active Orders</h1>
            <p className="text-xs text-gray-600">{activeOrders.length} deliveries in progress</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0 sm:w-5 sm:h-5" />
            <div>
              <p className="font-bold text-sm sm:text-base">Error</p>
              <p className="text-xs sm:text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-red-800 font-bold hover:underline text-xs"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 rounded-xl border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 text-xs sm:text-sm"
          >
            {refreshing ? (
              <>
                <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw size={14} className="sm:w-4 sm:h-4" />
                Refresh
              </>
            )}
          </button>
        </div>

        <ActiveOrdersList
          orders={activeOrders}
          loading={loading}
          compact={false}
          onOpen={(orderId) => navigate(`/rider/orders/${orderId}`, { state: { orderId } })}
        />

        {/* Empty State */}
        {!loading && activeOrders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
            <MapPin size={32} className="text-gray-400 mx-auto mb-3 sm:w-8 sm:h-8" />
            <h3 className="text-base sm:text-lg font-bold text-dark mb-2">No Active Orders</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              You don't have any active deliveries right now.
            </p>
            <button
              onClick={() => navigate('/rider/available-orders')}
              className="inline-block px-4 sm:px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-xs sm:text-sm"
            >
              Find Orders
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default ActiveOrders;
