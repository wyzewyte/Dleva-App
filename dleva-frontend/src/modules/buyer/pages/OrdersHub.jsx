import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Package, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import buyerOrders from '../../../services/buyerOrders';
import buyerRatings from '../../../services/buyerRatings';
import { logError } from '../../../utils/errorHandler';
import Cart from './Cart';
import BuyerOrderCard from '../components/BuyerOrderCard';
import RateOrderModal from '../components/RateOrderModal';
import {
  BuyerCard,
  BuyerEmptyState,
  BuyerFeedbackState,
  BuyerPageHeader,
  BuyerPrimaryButton,
  BuyerSecondaryButton,
  BuyerSegmentedTabs,
} from '../components/ui/BuyerPrimitives';
import BuyerPageLoading from '../components/ui/BuyerPageLoading';

const VALID_TABS = ['cart', 'ongoing', 'completed'];

const OrdersHub = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cartItems, addLocalItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const cartItemCount = useMemo(
    () => cartItems.reduce((count, item) => count + (Number(item.quantity) || 1), 0),
    [cartItems]
  );

  const defaultTab = useMemo(() => {
    if (cartItems.length > 0) return 'cart';
    if (isAuthenticated) return 'ongoing';
    return 'cart';
  }, [cartItems.length, isAuthenticated]);

  const requestedTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : defaultTab;

  useEffect(() => {
    if (requestedTab !== activeTab) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', activeTab);
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTab, requestedTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab === 'cart' || !isAuthenticated) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await buyerOrders.listOrders();
        setOrders(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } catch (err) {
        logError(err, { context: 'OrdersHub.fetchOrders' });
        setError(err.error || 'Failed to load your orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, isAuthenticated]);

  const ongoingOrders = useMemo(
    () => orders.filter((order) => !['delivered', 'cancelled', 'cancelled_by_buyer', 'cancelled_by_seller'].includes(order.status)),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((order) => ['delivered', 'cancelled', 'cancelled_by_buyer', 'cancelled_by_seller'].includes(order.status)),
    [orders]
  );

  const tabs = [
    { id: 'cart', label: 'Cart', badge: cartItemCount },
    { id: 'ongoing', label: 'Ongoing', badge: ongoingOrders.length },
    { id: 'completed', label: 'Completed', badge: 0 },
  ];

  const setActiveTab = (tabId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabId);
    setSearchParams(nextParams);
  };

  const handleReorder = async (order) => {
    try {
      let addedCount = 0;

      for (const orderItem of order.items || []) {
        if (!orderItem.menu_item) continue;

        await addLocalItem({
          id: orderItem.menu_item.id,
          name: orderItem.menu_item.name,
          price: parseFloat(orderItem.menu_item.price) || 0,
          image: orderItem.menu_item.image,
          vendorId: order.restaurant || order.restaurant_id,
          vendorName: order.restaurant_name || order.restaurant?.name,
          quantity: parseInt(orderItem.quantity, 10) || 1,
        });

        addedCount += 1;
      }

      if (addedCount > 0) {
        navigate('/orders?tab=cart');
      }
    } catch (err) {
      logError(err, { context: 'OrdersHub.handleReorder' });
      setError('We could not add those items back to your cart.');
    }
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      const results = await buyerRatings.submitOrderFeedback({
        orderId: selectedOrder.id,
        restaurantRating: ratingData.restaurantRating,
        riderRating: ratingData.riderRating,
        restaurantComment: ratingData.restaurantComment,
        riderComment: ratingData.riderComment,
      });
      
      // Check for individual rating errors
      if (results.restaurantError) {
        logError({ error: results.restaurantError }, { context: 'OrdersHub.handleRatingSubmit - restaurant' });
      }
      if (results.riderError) {
        logError({ error: results.riderError }, { context: 'OrdersHub.handleRatingSubmit - rider' });
      }
      // Don't close modal or update order status - modal shows success and stays open
    } catch (err) {
      logError(err, { context: 'OrdersHub.handleRatingSubmit' });
      setError('Failed to submit rating');
    }
  };

  const summaryCopy =
    activeTab === 'cart'
      ? `${cartItemCount} item${cartItemCount === 1 ? '' : 's'} ready for checkout`
      : activeTab === 'ongoing'
        ? `${ongoingOrders.length} active order${ongoingOrders.length === 1 ? '' : 's'}`
        : `${completedOrders.length} past order${completedOrders.length === 1 ? '' : 's'}`;

  const renderOrderContent = () => {
    if (!isAuthenticated) {
      return (
        <BuyerEmptyState
          icon={<LogIn size={28} />}
          title="Login to view your orders"
          description="Your cart stays available as a guest, but you need an account to track active and completed orders."
          action={<BuyerPrimaryButton onClick={() => navigate('/login')}>Login</BuyerPrimaryButton>}
          secondaryAction={<BuyerSecondaryButton onClick={() => navigate('/signup')}>Create Account</BuyerSecondaryButton>}
        />
      );
    }

    if (loading) {
      return <BuyerPageLoading variant="orders" />;
    }

    if (error) {
      return (
        <BuyerFeedbackState
          type="error"
          title="Could not load orders"
          message={error}
          action={<BuyerPrimaryButton onClick={() => setActiveTab(activeTab)}>Try Again</BuyerPrimaryButton>}
        />
      );
    }

    if (activeTab === 'ongoing' && ongoingOrders.length === 0) {
      return (
        <BuyerEmptyState
          icon={<Truck size={28} />}
          title="No ongoing orders yet"
          description="Once you place an order, live status updates and rider progress will show up here."
          action={<BuyerPrimaryButton onClick={() => navigate('/restaurants')}>Order Now</BuyerPrimaryButton>}
        />
      );
    }

    if (activeTab === 'completed' && completedOrders.length === 0) {
      return (
        <BuyerEmptyState
          icon={<Package size={28} />}
          title="No completed orders yet"
          description="Your delivered and cancelled orders will appear here, along with quick actions to reorder."
          action={<BuyerPrimaryButton onClick={() => navigate('/restaurants')}>Start Ordering</BuyerPrimaryButton>}
        />
      );
    }

    const source = activeTab === 'ongoing' ? ongoingOrders : completedOrders;

    return (
      <div className="space-y-4">
        {source.map((order) => (
          <BuyerOrderCard
            key={order.id}
            order={order}
            primaryActionLabel={activeTab === 'ongoing' ? 'Track Order' : 'Reorder'}
            onPrimaryAction={
              activeTab === 'ongoing'
                ? (selectedOrder) => navigate(`/tracking/${selectedOrder.id}`)
                : handleReorder
            }
            secondaryActionLabel={
              activeTab === 'ongoing'
                ? null
                : order.status === 'delivered'
                  ? 'Rate Order'
                  : 'View Details'
            }
            onSecondaryAction={
              activeTab === 'ongoing'
                ? null
                : order.status === 'delivered'
                  ? (selectedOrder) => {
                      setSelectedOrder(selectedOrder);
                      setIsRatingOpen(true);
                    }
                  : (selectedOrder) => navigate(`/tracking/${selectedOrder.id}`)
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <BuyerPageHeader
        title="Orders"
        showBack
      />

      <BuyerSegmentedTabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="bg-gray-50" />

      <BuyerCard className="px-4 py-3 shadow-none">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overview</p>
        <p className="mt-1 text-sm font-semibold text-dark">{summaryCopy}</p>
      </BuyerCard>

      <div className="pb-6">{activeTab === 'cart' ? <Cart /> : renderOrderContent()}</div>

      {selectedOrder && (
        <RateOrderModal
          key={`${selectedOrder?.id || 'hub-rating'}-${isRatingOpen ? 'open' : 'closed'}`}
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          order={selectedOrder}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

export default OrdersHub;
