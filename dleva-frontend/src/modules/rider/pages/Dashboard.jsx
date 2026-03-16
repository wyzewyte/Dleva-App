import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, AlertCircle, FileCheck, ChevronRight, 
  TrendingUp, MapPin, Clock, DollarSign, Zap 
} from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useOrder } from '../context/OrderContext';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import riderWallet from '../services/riderWallet';
import toast from '../../../services/toast';
import OnlineToggle from '../components/OnlineToggle';
import OrderFilter from '../components/OrderFilter';
import OrderCard from '../components/OrderCard';
import LoadingOrder from '../components/LoadingOrder';
import { formatCurrency } from '../../../utils/formatters';
import ActiveOrdersList from '../components/ActiveOrdersList';
import MESSAGES from '../../../constants/messages';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { rider, updateProfile } = useRiderAuth();
  const { 
    availableOrders, 
    activeOrders, 
    loading: contextLoading, 
    error: contextError, 
    actions 
  } = useOrder();
  // Destructure stable action functions to use in effects and avoid re-run loops
  const { fetchActiveOrders, fetchAvailableOrders } = actions;
  
  // WebSocket for real-time updates
  useOrderWebSocket({
    autoConnect: true,
    autoRefreshNewOrder: true,
    autoRefreshStatusUpdate: true,
    onNewOrder: (data) => {
      toast.success(`🎉 New order from ${data.restaurant_name || 'restaurant'}!`);
    },
    onStatusUpdate: (data) => {
      toast.info(`📍 Order ${data.order_id}: ${data.status}`);
    },
    onMessage: (data) => {
      toast.info(`💬 New message from customer`);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });
  
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [filters, setFilters] = useState({});
  const [earningsToday, setEarningsToday] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Fetch earnings today
  const fetchEarningsToday = async () => {
    try {
      setEarningsLoading(true);
      const data = await riderWallet.getEarningsToday();
      const earnings = parseFloat(data.earnings?.total_earned || data.earnings?.amount || 0);
      setEarningsToday(earnings);
    } catch (err) {
      console.warn('Failed to fetch earnings:', err);
      setEarningsToday(0);
    } finally {
      setEarningsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Always fetch active orders (these may be assigned even if rider cannot go online)
        await fetchActiveOrders().catch(err => {
          console.warn('Failed to fetch active orders:', err);
          // Don't throw - allow dashboard to render even if active orders fail
        });

        // Only fetch available orders if rider can go online
        // (backend won't assign orders to riders where can_go_online = false anyway)
        if (rider?.can_go_online === true) {
          await fetchAvailableOrders().catch(err => {
            console.warn('Failed to fetch available orders:', err);
          });
          fetchEarningsToday();
        }
      } catch (error) {
        console.error('Dashboard init error:', error);
      }
    };

    // Only run if rider is loaded (not undefined)
    if (rider) {
      initDashboard();
    }
    // Depend on rider and the stable action functions
  }, [rider, fetchActiveOrders, fetchAvailableOrders]);

  // Only refresh on focus/visibility change - no background polling
  useEffect(() => {
    if (!rider) return;

    let hasRefreshedAfterFocus = false;

    const handleFocus = async () => {
      // Only refresh once after page regains focus
      if (!hasRefreshedAfterFocus) {
        hasRefreshedAfterFocus = true;
        try {
          await Promise.all([
            fetchAvailableOrders().catch(() => {}),
            fetchActiveOrders().catch(() => {}),
          ]);
        } catch (err) {
          // Silently fail
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        hasRefreshedAfterFocus = false; // Reset flag when tab becomes visible
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [rider, fetchActiveOrders, fetchAvailableOrders]);

  // Update filtered orders when available orders change
  useEffect(() => {
    const filtered = availableOrders.filter(order => {
      if (filters.distance && order.distance_km > filters.distance) return false;
      if (filters.min_earnings && order.estimated_earnings < filters.min_earnings) return false;
      
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (!order.restaurant_name?.toLowerCase().includes(term)) return false;
      }
      
      return true;
    });

    if (filters.sorting) {
      const [field, direction] = filters.sorting.startsWith('-')
        ? [filters.sorting.slice(1), 'desc']
        : [filters.sorting, 'asc'];

      filtered.sort((a, b) => {
        const aVal = a[field] || 0;
        const bVal = b[field] || 0;
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    setFilteredOrders(filtered);
  }, [availableOrders, filters]);

  // Handle accept order
  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await actions.acceptOrder(orderId);
      // After accepting, immediately refresh active orders
      setTimeout(() => {
        console.log('✅ Order accepted - refreshing active orders');
        fetchActiveOrders().catch(err => console.warn('Failed to refresh after accept:', err));
      }, 500);
    } catch (err) {
      setDashboardError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle reject order
  const handleReject = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    
    try {
      await actions.rejectOrder(orderId);
    } catch (err) {
      setDashboardError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle online toggle
  const handleToggleOnline = () => {
    updateProfile({ is_online: !rider?.is_online });
  };

  // Handle refresh all data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setDashboardError('');
      console.log('🔄 Manual refresh triggered');
      await Promise.all([
        fetchAvailableOrders(),
        fetchActiveOrders(),
        fetchEarningsToday(),
      ]);
      console.log('✅ Refresh complete');
    } catch (err) {
      setDashboardError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-2xl mx-auto">

        {/* Online Status Toggle */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="p-4">
            <OnlineToggle isOnline={rider?.is_online} onToggle={handleToggleOnline} />
          </div>
        </div>

        <div className="p-4 space-y-6">

          {/* Verification Status Card */}
          {rider?.verification_status !== 'approved' && (
            <div className="bg-white border border-blue-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1">
                <FileCheck size={20} className="text-blue-600 flex-shrink-0 sm:w-6 sm:h-6" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Complete Verification</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {rider?.verification_status === 'pending' 
                      ? 'Your documents are under review'
                      : 'Upload required documents to start earning'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/rider/verification-documents')}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm shrink-0 whitespace-nowrap"
              >
                Documents
                <ChevronRight size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {(dashboardError || contextError) && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0 sm:w-5 sm:h-5" />
              <div>
                <p className="font-bold text-sm sm:text-base">Error</p>
                <p className="text-xs sm:text-sm">{dashboardError || contextError}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Earnings Today */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-3 sm:p-4">
              <div className="flex items-start justify-between mb-1 sm:mb-2">
                <div>
                  <p className="text-xs font-bold text-green-700">Today's Earnings</p>
                  {earningsLoading ? (
                    <div className="h-6 bg-green-200 rounded w-20 sm:w-24 mt-1 animate-pulse"></div>
                  ) : (
                    <p className="text-lg sm:text-2xl font-bold text-green-700 mt-0.5 sm:mt-0">{formatCurrency(earningsToday)}</p>
                  )}
                </div>
                <DollarSign size={20} className="text-green-600 opacity-50 sm:w-6 sm:h-6 flex-shrink-0" />
              </div>
              <p className="text-xs text-green-700">From deliveries</p>
            </div>

            {/* Available Orders */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-4">
              <div className="flex items-start justify-between mb-1 sm:mb-2">
                <div>
                  <p className="text-xs font-bold text-blue-700">Available Orders</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-700 mt-0.5 sm:mt-0">{availableOrders.length}</p>
                </div>
                <MapPin size={20} className="text-blue-600 opacity-50 sm:w-6 sm:h-6 flex-shrink-0" />
              </div>
              <p className="text-xs text-blue-700">Ready to accept</p>
            </div>
          </div>

          {/* Active Orders Quick View */}
          {(contextLoading || activeOrders.length > 0) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-xs sm:text-sm font-bold text-gray-600 uppercase flex items-center gap-1 sm:gap-2">
                  <Zap size={16} className="text-orange-600 flex-shrink-0 sm:block hidden" />
                  <Zap size={14} className="text-orange-600 flex-shrink-0 sm:hidden" />
                  Active Deliveries
                </h2>
                {activeOrders.length > 0 && (
                  <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">
                    {activeOrders.length}
                  </span>
                )}
              </div>

              <ActiveOrdersList
                orders={activeOrders.slice(0, 3)}
                loading={contextLoading}
                compact={true}
                onOpen={(orderId) => navigate(`/rider/orders/${orderId}`, { state: { orderId } })}
              />
              {activeOrders.length > 3 && (
                <div className="mt-3 sm:mt-4 text-center">
                  <button onClick={() => navigate('/rider/active-orders')} className="text-blue-600 font-bold hover:underline text-xs sm:text-sm">
                    View All {activeOrders.length} Active Orders →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/rider/available-orders')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 rounded-xl transition-colors flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <MapPin size={18} className="sm:w-5 sm:h-5" />
              <span>Find Orders</span>
            </button>
            <button
              onClick={() => navigate('/rider/active-orders')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 sm:py-3 rounded-xl transition-colors flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Clock size={18} className="sm:w-5 sm:h-5" />
              <span>Active</span>
            </button>
            <button
              onClick={() => navigate('/rider/order-history')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 sm:py-3 rounded-xl transition-colors flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <TrendingUp size={18} className="sm:w-5 sm:h-5" />
              <span>History</span>
            </button>
          </div>

          {/* Available Orders Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xs sm:text-sm font-bold text-gray-600 uppercase">
                Available Orders
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
              </button>
            </div>

            {/* Filter Section */}
            <OrderFilter onFilterChange={handleFilterChange} totalOrders={filteredOrders.length} />
          </div>

          {/* Loading State */}
          {contextLoading && availableOrders.length === 0 && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <LoadingOrder key={i} />
              ))}
            </div>
          )}

          {/* Orders List */}
          {!contextLoading && filteredOrders.length > 0 && (
            <div className="space-y-4">
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
          {!contextLoading && availableOrders.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
              <AlertCircle size={32} className="text-gray-400 mx-auto mb-3 sm:w-8 sm:h-8" />
              <h3 className="text-base sm:text-lg font-bold text-dark mb-2">No Orders Available</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                No new orders right now. Check back soon!
              </p>
            </div>
          )}

          {/* No Results After Filter */}
          {!contextLoading && availableOrders.length > 0 && filteredOrders.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
              <AlertCircle size={32} className="text-gray-400 mx-auto mb-3 sm:w-8 sm:h-8" />
              <h3 className="text-base sm:text-lg font-bold text-dark mb-2">No Orders Match Filters</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                Try adjusting your filter settings.
              </p>
              <button
                onClick={() => {
                  setFilters({});
                }}
                className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-xs sm:text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
