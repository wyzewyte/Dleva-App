import { useState, useEffect } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import OrderModal from '../components/OrderModal';
import sellerOrders from '../../../services/sellerOrders';
import { logError } from '../../../utils/errorHandler';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('new');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await sellerOrders.getOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      logError(err, { context: 'Orders.fetchOrders' });
      setError(err.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchOrders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await sellerOrders.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      // Show server message when available
      const msg = err?.error || err?.message || 'Failed to update order status';
      alert(msg);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const COLUMNS = [
    { 
      id: 'new', 
      label: 'New Orders', 
      bg: 'bg-blue-50/50', 
      border: 'border-blue-100', 
      statuses: ['pending'],
      nextStatus: 'confirming'
    },
    { 
      id: 'preparing', 
      label: 'Cooking', 
      bg: 'bg-orange-50/50', 
      border: 'border-orange-100', 
      statuses: ['confirming', 'preparing'],
      nextStatus: 'preparing'
    },
    { 
      id: 'ready', 
      label: 'Ready for Pickup', 
      bg: 'bg-green-50/50', 
      border: 'border-green-100', 
      statuses: ['available_for_pickup', 'awaiting_rider', 'assigned', 'arrived_at_pickup'],
      nextStatus: 'available_for_pickup'
    },
    { 
      id: 'rider_en_route', 
      label: 'On the Way', 
      bg: 'bg-purple-50/50', 
      border: 'border-purple-100', 
      statuses: ['picked_up']
    },
    { 
      id: 'history', 
      label: 'Delivered', 
      bg: 'bg-gray-50/50', 
      border: 'border-gray-100', 
      statuses: ['delivered', 'cancelled']
    },
  ];

  const getCount = (columnStatuses) => orders.filter(o => columnStatuses.includes(o.status)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-muted font-medium text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark">Kitchen Display</h1>
            <p className="text-xs sm:text-sm text-muted hidden sm:block mt-1">Manage orders from acceptance to handover.</p>
          </div>
          
          {/* Refresh Button */}
          <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 shadow-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          >
            <RefreshCcw size={20} className={isRefreshing ? "animate-spin text-primary" : ""} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 sm:px-6 md:px-8 pb-3 sm:pb-4">
            <div className="p-3 sm:p-4 bg-red-50 text-red-600 rounded-lg text-xs sm:text-sm border border-red-200">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-3 sm:pb-4 px-4 sm:px-6 md:px-8 pt-2 scrollbar-hide border-b border-gray-200 bg-white">
        {COLUMNS.map(col => {
          const count = getCount(col.statuses);
          const isActive = activeTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`
                whitespace-nowrap px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all min-h-[44px] flex items-center justify-center
                ${isActive ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-gray-200'}
              `}
            >
              {col.label}
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4"> 
        <div className="h-full flex flex-col md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-2 lg:gap-3 xl:gap-4 gap-3 overflow-y-auto md:overflow-y-hidden">
          {COLUMNS.map(col => {
            const isVisible = activeTab === col.id;
            const columnOrders = orders.filter(o => col.statuses.includes(o.status));

            return (
              <div 
                key={col.id} 
                className={`
                  flex flex-col h-48 sm:h-64 md:h-full rounded-lg sm:rounded-xl md:rounded-2xl border ${col.border} ${col.bg}
                  overflow-hidden transition-all duration-300 min-w-0 md:min-w-0 flex-1
                  ${isVisible ? 'flex' : 'hidden md:flex'}
                `}
              >
                <div className="p-2.5 sm:p-3 border-b border-gray-200/50 flex justify-between items-center bg-white/50 backdrop-blur-sm min-h-[44px]">
                  <h3 className="font-bold text-gray-700 text-xs sm:text-sm uppercase tracking-wider">{col.label}</h3>
                  <span className="bg-white text-dark text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-gray-100">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 sm:space-y-3">
                  {columnOrders.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-400 opacity-60">
                      <span className="text-3xl sm:text-4xl mb-2">🍽️</span>
                      <span className="text-xs font-medium">No orders</span>
                    </div>
                  ) : (
                    columnOrders.map(order => (
                        <OrderCard 
                          key={order.id} 
                          order={order} 
                          onStatusChange={handleStatusChange}
                          onViewDetails={handleViewDetails}
                        />
                      ))
          )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default SellerOrders;