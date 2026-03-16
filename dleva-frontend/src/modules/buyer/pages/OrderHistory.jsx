import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Loader2 } from 'lucide-react';
import buyerOrders from '../../../services/buyerOrders';
import buyerRatings from '../../../services/buyerRatings';
import RateOrderModal from '../components/RateOrderModal';
import { getStatusLabel } from '../../../constants/statusLabels';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Fetch order history
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await buyerOrders.listOrders();
        
        // ✅ FIXED: Handle both array and object responses
        const ordersList = Array.isArray(data) ? data : (data.results || []);
        
        console.log('Fetched orders DEBUG:', ordersList.map(o => ({
          id: o.id,
          items: o.items?.map(i => ({ name: i.menu_item?.name, qty: i.quantity })),
          total: o.total_price,
          subtotal: o.subtotal,
          delivery_fee: o.delivery_fee
        })));
        
        setOrders(ordersList);
        setError(null);
      } catch (err) {
        logError(err, { context: 'OrderHistory.fetchOrders' });
        setError(err.error || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleRateOrder = (order) => {
    setSelectedOrder(order);
    setIsRatingOpen(true);
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      await buyerRatings.rateOrder(
        selectedOrder.id,
        ratingData.rating,
        ratingData.comment
      );
      
      // Update local state
      setOrders(orders.map(o => 
        o.id === selectedOrder.id 
          ? { ...o, is_rated: true }
          : o
      ));
      
      setIsRatingOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      logError(err, { context: 'OrderHistory.handleRatingSubmit' });
      alert('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-dark mb-6">Order History</h1>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted">No orders yet</p>
            <button 
              onClick={() => navigate('/restaurants')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-bold"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/tracking/${order.id}`)}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-dark">{order.restaurant_name}</h3>
                    <p className="text-xs text-muted">Order #{order.id}</p>
                  </div>
                  {(() => {
                    const statusInfo = getStatusLabel(order.status);
                    return (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Items - ✅ FIXED: Display items correctly */}
                <div className="text-sm text-muted mb-3 pb-3 border-b">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    <>
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx}>
                          {item.menu_item?.name} x{item.quantity}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p>+{order.items.length - 2} more items</p>
                      )}
                    </>
                  ) : (
                    <p>No items</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-dark">
                      ₦{Number(order.total_price || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* ✅ FIXED: Check is_rated instead of rated */}
                  {order.status === 'delivered' && !order.is_rated && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRateOrder(order);
                      }}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                    >
                      <Star size={14} className="inline mr-1" />
                      Rate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {selectedOrder && (
        <RateOrderModal 
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          order={selectedOrder}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

export default OrderHistory;