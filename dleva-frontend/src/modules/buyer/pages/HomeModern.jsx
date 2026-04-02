import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, Star } from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import RateOrderModal from '../components/RateOrderModal';
import NoVendorsEmptyState from '../components/NoVendorsEmptyState';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import useLocation from '../../../hooks/useLocation';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerOrders from '../../../services/buyerOrders';
import buyerRatings from '../../../services/buyerRatings';
import buyerMenu from '../../../services/buyerMenu';
import { useCart } from '../../../modules/buyer/context/CartContext';
import { logError } from '../../../utils/errorHandler';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { getCategoryIcon } from '../../../constants/categoryIcons';
import {
  BuyerCard,
  BuyerEmptyState,
  BuyerFeedbackState,
  BuyerPrimaryButton,
  BuyerSearchField,
} from '../components/ui/BuyerPrimitives';

const HomeLoadingSkeleton = ({ user }) => {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <section className="space-y-4 border-b border-gray-100 py-5">
        <div>
          <h1 className="max-w-[16ch] text-[1.5rem] font-bold leading-tight tracking-tight text-dark sm:text-[1.65rem]">
            {user ? `Hello, ${user.name?.split(' ')[0] || user.username}` : 'Are you hungry?'}
          </h1>
          <p className="mt-1 text-sm text-muted">What are you ordering today?</p>
        </div>

        <BuyerSearchField
          placeholder="Search jollof, chicken, drinks..."
          readOnly
          className="pointer-events-none"
        />
      </section>

      <section className="space-y-4">
        <div className="h-6 w-36 animate-pulse rounded bg-gray-100" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex min-w-[92px] flex-col items-center gap-2">
              <div className="h-[84px] w-[92px] animate-pulse rounded-[18px] bg-gray-100" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <BuyerCard key={item} className="overflow-hidden">
              <div className="h-48 animate-pulse bg-gray-100" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              </div>
            </BuyerCard>
          ))}
        </div>
      </section>
    </div>
  );
};

const HomeModern = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLocation, openLocationSetup } = useLocation();
  const { addLocalItem } = useCart();

  const [restaurants, setRestaurants] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesWithItems, setCategoriesWithItems] = useState(new Set());
  const [lastOrder, setLastOrder] = useState(null);
  const [unratedOrder, setUnratedOrder] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get(API_ENDPOINTS.MENU.CATEGORIES);
        setCategories(response.data.results || []);
      } catch (err) {
        logError(err, { context: 'HomeModern.fetchCategories' });
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        if (!currentLocation?.latitude || !currentLocation?.longitude) {
          setRestaurants([]);
          setAllMenuItems([]);
          setCategoriesWithItems(new Set());
          setError(null);
          return;
        }

        const data = await buyerRestaurants.listRestaurants(currentLocation.latitude, currentLocation.longitude);
        const list = Array.isArray(data) ? data : data.results || [];
        setRestaurants(list);
        setError(null);

        const usedCategories = new Set();
        const items = [];

        for (const restaurant of list) {
          const menuData = await buyerMenu.getMenuItems(restaurant.id);
          const restaurantItems = Array.isArray(menuData) ? menuData : menuData.results || [];
          restaurantItems.forEach((item) => {
            const categoryId = typeof item.category === 'object' ? item.category?.id : item.category;
            if (categoryId != null) usedCategories.add(categoryId);
            items.push({
              ...item,
              restaurant_id: restaurant.id,
              restaurant_name: restaurant.name,
              restaurant_delivery_fee: restaurant.delivery_fee,
            });
          });
        }

        setAllMenuItems(items);
        setCategoriesWithItems(usedCategories);
      } catch (err) {
        logError(err, { context: 'HomeModern.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [currentLocation]);

  useEffect(() => {
    const fetchLastOrder = async () => {
      if (!user) return;
      try {
        const orders = await buyerOrders.listOrders();
        if (orders?.length > 0) {
          const latest = orders[0];
          setLastOrder(latest);

          const timestamp = latest.completed_at || latest.delivered_at || latest.created_at;
          const dismissed = JSON.parse(localStorage.getItem('dismissed_rating_orders') || '[]');
          const isRecent = timestamp ? (new Date() - new Date(timestamp)) / (1000 * 60 * 60) < 24 : false;

          if (latest.status === 'delivered' && !latest.is_rated && isRecent && !dismissed.includes(latest.id)) {
            setUnratedOrder(latest);
          }
        }
      } catch (err) {
        logError(err, { context: 'HomeModern.fetchLastOrder' });
      }
    };

    fetchLastOrder();
  }, [user]);

  const categoriesWithItemsList = useMemo(
    () => categories.filter((category) => categoriesWithItems.has(category.id)),
    [categories, categoriesWithItems]
  );

  const filteredMenuItems = useMemo(() => {
    if (!selectedCategory) return [];
    return allMenuItems.filter((item) => {
      const categoryId = typeof item.category === 'object' ? item.category?.id : item.category;
      return categoryId === selectedCategory;
    });
  }, [allMenuItems, selectedCategory]);

  const closePopup = () => {
    if (unratedOrder?.id) {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_rating_orders') || '[]');
      if (!dismissed.includes(unratedOrder.id)) {
        dismissed.push(unratedOrder.id);
        localStorage.setItem('dismissed_rating_orders', JSON.stringify(dismissed));
      }
    }
    setUnratedOrder(null);
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
          vendorId: order.restaurant,
          vendorName: order.restaurant_name,
          quantity: parseInt(orderItem.quantity, 10) || 1,
        });
        addedCount += 1;
      }

      if (addedCount > 0) {
        navigate('/orders?tab=cart');
      }
    } catch (err) {
      logError(err, { context: 'HomeModern.handleReorder' });
    }
  };

  const timeSinceDelivery = (order) => {
    const timestamp = order?.completed_at || order?.delivered_at || order?.created_at;
    if (!timestamp) return null;
    const diffHours = (Date.now() - new Date(timestamp)) / (1000 * 60 * 60);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hour${Math.floor(diffHours) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
  };

  const isWithin24Hours = (order) => {
    const timestamp = order?.completed_at || order?.delivered_at || order?.created_at;
    if (!timestamp) return false;
    return (Date.now() - new Date(timestamp)) / (1000 * 60 * 60) < 24;
  };

  const handleRatingSubmit = async (ratingData) => {
    if (!unratedOrder?.id) return;

    try {
      await buyerRatings.submitOrderFeedback({
        orderId: unratedOrder.id,
        restaurantRating: ratingData.restaurantRating,
        riderRating: ratingData.riderRating,
        comment: ratingData.comment,
      });
      setLastOrder((previous) => (
        previous?.id === unratedOrder.id ? { ...previous, is_rated: true } : previous
      ));
      setIsRatingOpen(false);
      setUnratedOrder(null);
    } catch (err) {
      logError(err, { context: 'HomeModern.handleRatingSubmit', orderId: unratedOrder.id });
      setError(err.error || 'Failed to submit your rating');
    }
  };

  if (loading) {
    return <HomeLoadingSkeleton user={user} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <section className="space-y-4 border-b border-gray-100 py-5">
        <div>
          <h1 className="max-w-[16ch] text-[1.65rem] font-bold leading-tight tracking-tight text-dark sm:text-[1.95rem]">
            {user ? `Hello, ${user.name?.split(' ')[0] || user.username}` : 'Find something to eat'}
          </h1>
          <p className="mt-1 text-sm text-muted">What are you ordering today?</p>
        </div>

        <BuyerSearchField
          placeholder="Search jollof, chicken, drinks..."
          readOnly
          onClick={() => navigate('/search')}
        />
      </section>

      {user && lastOrder && isWithin24Hours(lastOrder) ? (
        <BuyerCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order again</p>
              <h2 className="mt-1 text-lg font-semibold text-dark">{lastOrder.restaurant_name || 'Recent order'}</h2>
              <p className="mt-2 text-sm text-muted">
                {(lastOrder.items || []).length} item{(lastOrder.items || []).length === 1 ? '' : 's'} • {timeSinceDelivery(lastOrder) || 'Recent order'}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <BuyerPrimaryButton className="sm:w-auto" onClick={() => handleReorder(lastOrder)}>
                Reorder
              </BuyerPrimaryButton>
            </div>
          </div>
        </BuyerCard>
      ) : null}

      {categoriesWithItemsList.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-dark">Categories</h2>
            {categoriesLoading ? <span className="text-xs text-muted">Loading…</span> : null}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {categoriesWithItemsList.map((category) => {
              const isActive = category.id === selectedCategory;
              const { icon: Icon, bg, color } = getCategoryIcon(category.icon);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(isActive ? null : category.id)}
                  className="flex min-w-[92px] flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-[84px] w-[92px] items-center justify-center rounded-[18px] border transition-all ${
                      isActive ? 'border-primary bg-primary text-white shadow-sm' : `${bg} border-gray-100`
                    }`}
                  >
                    <Icon size={30} className={isActive ? 'text-white' : color} />
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-muted'}`}>
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedCategory && filteredMenuItems.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-dark">
            {categories.find((category) => category.id === selectedCategory)?.name || 'Items'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenuItems.map((item) => (
              <BuyerCard key={item.id} interactive className="overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-gray-100" />
                )}
                <div className="p-4">
                  <h3 className="truncate text-base font-semibold text-dark">{item.name}</h3>
                  <p className="mt-1 truncate text-sm text-muted">{item.restaurant_name}</p>
                  {item.description ? <p className="mt-2 line-clamp-2 text-sm text-muted">{item.description}</p> : null}
                </div>
              </BuyerCard>
            ))}
          </div>
        </section>
      ) : null}

      {restaurants.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-dark">Nearby Restaurants</h2>

          {error ? (
            <BuyerCard className="border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</BuyerCard>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name}
                  image={restaurant.image}
                  rating={restaurant.rating}
                  delivery_time={restaurant.delivery_time}
                  delivery_fee={restaurant.delivery_fee}
                  is_open={restaurant.is_open}
                  is_active={restaurant.is_active}
                  category={restaurant.category}
                />
              ))}
            </div>
          )}
        </section>
      ) : !currentLocation ? (
        <BuyerEmptyState
          icon={<MapPin size={24} />}
          title="Set your delivery location"
          description="Choose where you want your food delivered so we can show nearby restaurants."
          action={<BuyerPrimaryButton onClick={openLocationSetup}>Set Location</BuyerPrimaryButton>}
        />
      ) : (
        <NoVendorsEmptyState
          latitude={currentLocation.latitude}
          longitude={currentLocation.longitude}
          address={currentLocation.address}
        />
      )}

      {unratedOrder ? (
        <div className="fixed bottom-20 left-4 right-4 z-40 md:bottom-6">
          <div className="mx-auto max-w-md">
            <BuyerCard className="border-dark bg-dark p-4 text-white shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">Delivered {timeSinceDelivery(unratedOrder)}</p>
                  <p className="mt-1 text-sm font-semibold">How was {unratedOrder.restaurant?.name || unratedOrder.restaurant_name}?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRatingOpen(true)}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
                >
                  <Star size={14} fill="currentColor" />
                  Rate
                </button>
              </div>
              <button type="button" onClick={closePopup} className="mt-3 text-xs font-medium text-white/70">
                Dismiss
              </button>
            </BuyerCard>
          </div>
        </div>
      ) : null}

      <RateOrderModal
        key={`${unratedOrder?.id || 'home-rating'}-${isRatingOpen ? 'open' : 'closed'}`}
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        order={unratedOrder}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default HomeModern;
