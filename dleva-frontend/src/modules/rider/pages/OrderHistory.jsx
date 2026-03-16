/**
 * OrderHistory Page
 * Displays completed orders and earnings summary
 * Includes filtering by date and status
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { riderOrders } from '../services';
import { formatCurrency } from '../../../utils/formatters';
import MESSAGES from '../../../constants/messages';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [statusFilter, setStatusFilter] = useState('delivered');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Fetch order history
  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await riderOrders.getOrderHistory({
        status: statusFilter,
        date_from: dateRange.from,
        date_to: dateRange.to,
      });

      const ordersList = Array.isArray(data.orders) ? data.orders : data.results || [];
      setOrders(ordersList);
      setFilteredOrders(ordersList);

      // Calculate total earnings
      const total = ordersList.reduce((sum, order) => {
        const earnings = typeof order.rider_earning === 'string'
          ? parseFloat(order.rider_earning)
          : (order.rider_earning || 0);
        return sum + earnings;
      }, 0);
      setTotalEarnings(total);
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrderHistory();
  }, []);

  // Handle filter changes
  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  const handleApplyFilters = () => {
    fetchOrderHistory();
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colorMap = {
      'delivered': 'bg-green-50 border-green-200 text-green-700',
      'delivery_attempted': 'bg-yellow-50 border-yellow-200 text-yellow-700',
      'cancelled': 'bg-red-50 border-red-200 text-red-700',
    };
    return colorMap[status?.toLowerCase()] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'delivered': 'Delivered',
      'delivery_attempted': 'Attempted',
      'cancelled': 'Cancelled',
    };
    return labels[status?.toLowerCase()] || status || 'Unknown';
  };

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
            <h1 className="font-bold text-dark">Order History</h1>
            <p className="text-xs text-gray-600">{orders.length} orders</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
              <button
                onClick={handleApplyFilters}
                className="mt-2 text-red-800 font-bold hover:underline text-xs"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Earnings Summary */}
        {!loading && orders.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 font-bold mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
                <p className="text-xs text-gray-600 mt-2">{orders.length} deliveries</p>
              </div>
              <TrendingUp size={32} className="text-green-600 opacity-50" />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-600 uppercase">Filters</h2>

          {/* Status Filter */}
          <div>
            <p className="text-xs text-gray-600 font-bold mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {['delivered', 'delivery_attempted', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-dark hover:bg-gray-200'
                  }`}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-600 font-bold">Date Range</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyFilters}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm mt-4"
          >
            Apply Filters
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600 flex-shrink-0" />
            <span className="text-gray-600 font-medium text-sm">Loading order history...</span>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const orderId = order.id || order.order_id;
              const status = order.status || 'completed';
              const restaurantName = order.restaurant_name || 'Restaurant';
              const deliveryDate = order.delivered_at || order.time_created || 'N/A';
              const riderEarning = typeof order.rider_earning === 'string'
                ? parseFloat(order.rider_earning)
                : (order.rider_earning || 0);
              const distanceKm = typeof order.distance_km === 'string'
                ? parseFloat(order.distance_km)
                : (order.distance_km || 0);

              return (
                <button
                  key={orderId}
                  onClick={() => navigate(`/rider/orders/${orderId}`, { state: { order } })}
                  className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all text-left"
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-dark">Order #{orderId}</h3>
                      <p className="text-xs text-gray-600 mt-1">{restaurantName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar size={12} />
                        <span>{deliveryDate}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {distanceKm.toFixed(1)} km
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Earnings</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(riderEarning)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar size={32} className="text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-dark mb-2">No Orders Found</h3>
            <p className="text-gray-600 mb-6">
              No orders match your current filters. Try adjusting the date range or status.
            </p>
            <button
              onClick={() => {
                setStatusFilter('delivered');
                setDateRange({
                  from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                  to: new Date().toISOString().split('T')[0],
                });
                fetchOrderHistory();
              }}
              className="inline-block px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-sm"
            >
              Reset Filters
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default OrderHistory;
