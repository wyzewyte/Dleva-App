import { DollarSign, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import sellerOrders from '../../../services/sellerOrders';
import sellerAnalytics from '../../../services/sellerAnalytics';
import sellerStore from '../../../services/sellerStore';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';

// Reusable Card Component
const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs text-muted font-bold uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl font-bold text-dark">
        {loading ? '...' : value}
      </h3>
    </div>
  </div>
);

const SellerDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);  // ✅ Add state for store status
  const [storeLoading, setStoreLoading] = useState(true);  // ✅ Add loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setStoreLoading(true);
        
        // Fetch both analytics and store status
        const [analyticsData, storeData] = await Promise.all([
          sellerAnalytics.getAnalytics(),
          sellerStore.getStoreStatus(),
        ]);
        
        setAnalytics(analyticsData);
        setStoreStatus(storeData);
        setError(null);
      } catch (err) {
        logError(err, { context: 'Dashboard.fetchData' });
        setError(err.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
        setStoreLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return `₦${parseFloat(value).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  };

  const formatTime = (totalMinutes) => {
    if (!totalMinutes) return '0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // ✅ Handle store status toggle
  const handleStoreStatusToggle = async () => {
    try {
      const newStatus = !storeStatus.is_active;
      await sellerStore.updateStoreStatus(newStatus);
      setStoreStatus(prev => ({ ...prev, is_active: newStatus }));
    } catch (err) {
      logError(err, { context: 'Dashboard.handleStoreStatusToggle' });
      setError('Failed to update store status');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-0">
        <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted mt-1">Overview for <span className="font-semibold text-primary">
              {analytics?.restaurant_name || 'Your Restaurant'}
            </span></p>
        </div>
        
        {/* ✅ Store Status Badge - Now Dynamic */}
        <button
          onClick={handleStoreStatusToggle}
          disabled={storeLoading}
          className={`text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1 transition-all min-h-[44px] justify-center sm:justify-start whitespace-nowrap ${
            storeStatus?.is_active 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          } ${storeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title="Click to toggle store status"
        >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${storeStatus?.is_active ? 'bg-green-600' : 'bg-red-600'} ${storeStatus?.is_active ? 'animate-pulse' : ''}`}></span>
            {storeLoading ? 'Loading...' : (storeStatus?.is_active ? 'Store Open' : 'Store Closed')}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Total Revenue" 
          value={analytics ? formatCurrency(analytics.total_earnings) : '₦0'} 
          icon={DollarSign} 
          color="bg-green-500"
          loading={loading}
        />
        <StatCard 
          title="Active Orders" 
          value={analytics ? analytics.total_orders : '0'} 
          icon={ShoppingBag} 
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard 
          title="Completed Orders" 
          value={analytics ? analytics.completed_orders : '0'} 
          icon={Clock} 
          color="bg-orange-500"
          loading={loading}
        />
        <StatCard 
          title="Repeat Customers" 
          value={analytics ? analytics.repeat_customers : '0'} 
          icon={TrendingUp} 
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      {/* Today's Stats */}
      {analytics?.today && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1 sm:mb-2">Today's Orders</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-blue-900">{analytics.today.orders}</h3>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1 sm:mb-2">Today's Earnings</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-green-900">{formatCurrency(analytics.today.earnings)}</h3>
          </div>
        </div>
      )}

      {/* Top Selling Items */}
      {analytics?.top_selling_items && analytics.top_selling_items.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-dark mb-4">Top Selling Items</h3>
          <div className="space-y-2 sm:space-y-3">
            {analytics.top_selling_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl gap-2">
                <span className="text-sm font-medium text-dark truncate flex-1">{item.menu_item__name}</span>
                <span className="bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                  {item.total_sold} sold
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State / Placeholder for Orders */}
      {!loading && (!analytics?.total_orders || analytics.total_orders === 0) && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center py-16 sm:py-20">
         <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <ShoppingBag size={32} />
         </div>
         <h3 className="text-base sm:text-lg font-bold text-dark">No Orders Yet</h3>
         <p className="text-xs sm:text-sm text-muted mt-1">Orders will appear here automatically when customers place them.</p>
      </div>
      )}

    </div>
  );
};

export default SellerDashboard;