import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const LoggedOutOrdersIllustration = () => (
  <svg viewBox="0 0 200 160" className="mx-auto h-32 w-32" fill="none" aria-hidden="true">
    <ellipse cx="100" cy="148" rx="55" ry="8" fill="#FFF3E0" />
    <path d="M62 56 C62 47.2 69.2 40 78 40 H122 C130.8 40 138 47.2 138 56 V125 H62 V56 Z" fill="#FFB562" />
    <path d="M62 56 C62 47.2 69.2 40 78 40 H100 V125 H62 V56 Z" fill="#F47B00" />
    <path d="M70 58 H130" stroke="#D96E00" strokeWidth="5" strokeLinecap="round" />
    <path d="M82 40 Q82 24 100 24 Q118 24 118 40" stroke="#388E3C" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M78 75 H104" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    <path d="M78 90 H96" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <path d="M117 82 H137" stroke="#1A4731" strokeWidth="4" strokeLinecap="round" />
    <path d="M130 72 L141 82 L130 92" stroke="#1A4731" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="74" cy="31" r="2" fill="#FFF3E0" opacity="0.8" />
    <circle cx="132" cy="31" r="1.5" fill="#FFF3E0" opacity="0.6" />
  </svg>
);

const OngoingOrdersIllustration = () => (
  <svg viewBox="0 0 200 160" className="mx-auto h-32 w-32" fill="none" aria-hidden="true">
    <ellipse cx="100" cy="148" rx="55" ry="8" fill="#FFF3E0" />
    <path d="M48 94 H116 C123.2 94 129 99.8 129 107 V122 H48 V94 Z" fill="#F47B00" />
    <path d="M129 104 H150 L163 116 V122 H129 V104 Z" fill="#FFB562" />
    <path d="M145 108 H152 L158 114 H145 V108 Z" fill="white" opacity="0.75" />
    <path d="M59 94 H93" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
    <circle cx="70" cy="126" r="10" fill="#1A4731" />
    <circle cx="70" cy="126" r="4" fill="#FFF3E0" />
    <circle cx="143" cy="126" r="10" fill="#1A4731" />
    <circle cx="143" cy="126" r="4" fill="#FFF3E0" />
    <path d="M58 70 C80 48 114 48 137 69" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" strokeDasharray="5 8" />
    <path d="M130 62 L139 70 L128 76" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="52" cy="74" r="3" fill="#FFF3E0" />
    <circle cx="150" cy="54" r="2" fill="#FFF3E0" opacity="0.7" />
  </svg>
);

const CompletedOrdersIllustration = () => (
  <svg viewBox="0 0 200 160" className="mx-auto h-32 w-32" fill="none" aria-hidden="true">
    <ellipse cx="100" cy="148" rx="55" ry="8" fill="#FFF3E0" />
    <path d="M62 62 L100 42 L138 62 V120 L100 140 L62 120 V62 Z" fill="#FFB562" />
    <path d="M62 62 L100 82 V140 L62 120 V62 Z" fill="#F47B00" />
    <path d="M138 62 L100 82 V140 L138 120 V62 Z" fill="#D96E00" />
    <path d="M62 62 L100 82 L138 62" stroke="#FFF3E0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    <circle cx="137" cy="48" r="20" fill="#1A4731" />
    <path d="M127 48 L134 55 L148 40" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M78 95 L92 102" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <circle cx="64" cy="38" r="2" fill="#FFF3E0" opacity="0.8" />
    <circle cx="153" cy="85" r="1.5" fill="#FFF3E0" opacity="0.6" />
  </svg>
);

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
          illustration={<LoggedOutOrdersIllustration />}
          title="Login to view your orders"
          description="Your cart stays available as a guest, but you need an account to track active and completed orders."
          action={<BuyerPrimaryButton onClick={() => navigate('/login')}>Login</BuyerPrimaryButton>}
          secondaryAction={
            <BuyerSecondaryButton
              onClick={() => navigate('/signup')}
              className="border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
            >
              Create Account
            </BuyerSecondaryButton>
          }
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
          illustration={<OngoingOrdersIllustration />}
          title="No ongoing orders yet"
          description="Once you place an order, live status updates and rider progress will show up here."
          action={<BuyerPrimaryButton onClick={() => navigate('/restaurants')}>Order Now</BuyerPrimaryButton>}
        />
      );
    }

    if (activeTab === 'completed' && completedOrders.length === 0) {
      return (
        <BuyerEmptyState
          illustration={<CompletedOrdersIllustration />}
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
