import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import buyerOrders from '../../../services/buyerOrders';
import buyerRatings from '../../../services/buyerRatings';
import { logError } from '../../../utils/errorHandler';
import BuyerOrderCard from '../components/BuyerOrderCard';
import RateOrderModal from '../components/RateOrderModal';
import {
  BuyerEmptyState,
  BuyerFeedbackState,
  BuyerPageHeader,
  BuyerPrimaryButton,
} from '../components/ui/BuyerPrimitives';

const OrderHistoryModern = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await buyerOrders.listOrders();
        setOrders(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } catch (err) {
        logError(err, { context: 'OrderHistoryModern.fetchOrders' });
        setError(err.error || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleRatingSubmit = async (ratingData) => {
    try {
      await buyerRatings.submitOrderFeedback({
        orderId: selectedOrder.id,
        restaurantRating: ratingData.restaurantRating,
        riderRating: ratingData.riderRating,
        comment: ratingData.comment,
      });
      setOrders((previous) => previous.map((order) => (
        order.id === selectedOrder.id ? { ...order, is_rated: true } : order
      )));
      setIsRatingOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      logError(err, { context: 'OrderHistoryModern.handleRatingSubmit' });
      setError('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <BuyerFeedbackState
        type="loading"
        title="Loading your order history"
        message="We are gathering your completed deliveries and reorder details."
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BuyerPageHeader
        title="Order History"
        showBack
      />

      {error && (
        <BuyerFeedbackState
          type="error"
          title="Could not load order history"
          message={error}
          action={<BuyerPrimaryButton onClick={() => navigate(0)}>Try Again</BuyerPrimaryButton>}
        />
      )}

      {!error && orders.length === 0 ? (
        <BuyerEmptyState
          icon={<Package size={28} />}
          title="No orders yet"
          description="Once you complete an order, it will show up here with reorder and rating shortcuts."
          action={<BuyerPrimaryButton onClick={() => navigate('/restaurants')}>Start Ordering</BuyerPrimaryButton>}
        />
      ) : null}

      {!error && orders.length > 0 ? (
        <div className="space-y-4 pb-6">
          {orders.map((order) => (
            <BuyerOrderCard
              key={order.id}
              order={order}
              primaryActionLabel="View Details"
              onPrimaryAction={(selectedOrder) => navigate(`/tracking/${selectedOrder.id}`)}
              secondaryActionLabel={order.status === 'delivered' && !order.is_rated ? 'Rate Order' : null}
              onSecondaryAction={
                order.status === 'delivered' && !order.is_rated
                  ? (selectedOrder) => {
                      setSelectedOrder(selectedOrder);
                      setIsRatingOpen(true);
                    }
                  : null
              }
            />
          ))}
        </div>
      ) : null}

      {selectedOrder && (
        <RateOrderModal
          key={`${selectedOrder?.id || 'history-rating'}-${isRatingOpen ? 'open' : 'closed'}`}
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          order={selectedOrder}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

export default OrderHistoryModern;
