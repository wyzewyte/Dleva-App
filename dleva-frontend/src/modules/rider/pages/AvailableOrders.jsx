/**
 * AvailableOrders Page
 * Displays list of available orders that rider can accept
 * Includes filtering, sorting, and real-time refresh
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, ArrowLeft, Loader2, Bell } from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useOrder } from '../context/OrderContext';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import toast from '../../../services/toast';
import OrderFilter from '../components/OrderFilter';
import OrderCard from '../components/OrderCard';
import LoadingOrder from '../components/LoadingOrder';
import MESSAGES from '../../../constants/messages';

const AvailableOrders = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const { 
    availableOrders, 
    loading, 
    error, 
    actions 
  } = useOrder();
  
  // WebSocket for real-time new orders
  useOrderWebSocket({
    autoConnect: true,
    autoRefreshNewOrder: true,
    autoRefreshStatusUpdate: false,
    onNewOrder: (data) => {
      toast.success(`🎉 New order from ${data.restaurant_name || 'restaurant'}!`, {
        type: 'success',
        duration: 4000,
      });
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [filters, setFilters] = useState({});

  // Handle accept order
  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await actions.acceptOrder(orderId);
      toast.success('Order accepted! Check Active Orders.', {
        type: 'success',
        duration: 3000,
      });
      // Immediately refresh available orders to remove accepted order from list
      setTimeout(() => {
        console.log('✅ Order accepted - refreshing available orders');
        actions.fetchAvailableOrders(filters).catch(err => console.warn('Failed to refresh:', err));
      }, 300);
    } catch (err) {
      toast.error(err.error || MESSAGES.ERROR.SOMETHING_WRONG, {
        type: 'error',
        duration: 5000,
      });
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle reject order
  const handleReject = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    
    try {
      await actions.rejectOrder(orderId, 'Rejected by rider');
      toast.success('Order rejected.', {
        type: 'success',
        duration: 3000,
      });
    } catch (err) {
      toast.error(err.error || MESSAGES.ERROR.SOMETHING_WRONG, {
        type: 'error',
        duration: 5000,
      });
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    let filtered = availableOrders;

    if (newFilters.distance) {
      filtered = filtered.filter(o => o.distance_km <= newFilters.distance);
    }

    if (newFilters.min_earnings) {
      filtered = filtered.filter(o => o.estimated_earnings >= newFilters.min_earnings);
    }

    if (newFilters.search) {
      const term = newFilters.search.toLowerCase();
      filtered = filtered.filter(o =>
        o.restaurant_name?.toLowerCase().includes(term)
      );
    }

    if (newFilters.sorting) {
      const [field, direction] = newFilters.sorting.startsWith('-')
        ? [newFilters.sorting.slice(1), 'desc']
        : [newFilters.sorting, 'asc'];

      filtered.sort((a, b) => {
        const aVal = a[field] || 0;
        const bVal = b[field] || 0;
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    setFilteredOrders(filtered);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await actions.fetchAvailableOrders(filters);
    } catch (err) {
      toast.error('Failed to refresh orders', {
        type: 'error',
        duration: 4000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch available orders on mount
  useEffect(() => {
    if (availableOrders.length === 0) {
      actions.fetchAvailableOrders();
    }
  }, []);

  // Only refresh on focus - no background polling
  useEffect(() => {
    let hasRefreshedAfterFocus = false;

    const handleFocus = async () => {
      if (!hasRefreshedAfterFocus) {
        hasRefreshedAfterFocus = true;
        try {
          await actions.fetchAvailableOrders(filters).catch(() => {});
        } catch (err) {
          // Silently fail
        }
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [filters, actions]);

  // Update filtered orders when available orders change
  useEffect(() => {
    handleFilterChange(filters);
  }, [availableOrders]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
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
            <h1 className="font-bold text-dark">Available Orders</h1>
            <p className="text-xs text-gray-600">{filteredOrders.length} orders found</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <OrderFilter onFilterChange={handleFilterChange} totalOrders={filteredOrders.length} />

        {/* Verification Check */}
        {!rider?.can_go_online && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-yellow-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Not Verified</p>
              <p>Complete your verification to start accepting orders.</p>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 active:scale-95"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </div>

        {/* Loading State */}
        {loading && !availableOrders.length && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <LoadingOrder key={i} />
            ))}
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div>
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={handleAccept}
                onReject={handleReject}
                isLoading={acceptingId === order.id}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <AlertCircle size={32} className="text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-dark mb-2">No Orders Available</h3>
            <p className="text-gray-600 mb-6">
              {availableOrders.length === 0
                ? 'No new orders right now. Check back soon!'
                : 'No orders match your filters. Try adjusting them.'}
            </p>
            {availableOrders.length > 0 && (
              <button
                onClick={() => {
                  setFilters({});
                  setFilteredOrders(availableOrders);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default AvailableOrders;
