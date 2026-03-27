import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { X, Star, MapPin } from 'lucide-react';
import Input from '../../../components/ui/Input';
import RestaurantCard from "../components/RestaurantCard";
import RateOrderModal from '../components/RateOrderModal';
import NoVendorsEmptyState from '../components/NoVendorsEmptyState';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import useLocation from '../../../hooks/useLocation';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerOrders from '../../../services/buyerOrders';
import buyerMenu from '../../../services/buyerMenu';
import { useCart } from '../../../modules/buyer/context/CartContext';
import { logError } from '../../../utils/errorHandler';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { getCategoryIcon } from '../../../constants/categoryIcons';

const BuyerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLocation, openLocationSetup } = useLocation();
  const { addLocalItem } = useCart();

  // State for restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for menu items
  const [allMenuItems, setAllMenuItems] = useState([]);

  // State for categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesWithItems, setCategoriesWithItems] = useState(new Set());

  // Navigate to search page when search input is clicked
  const handleSearchClick = () => {
    navigate('/search');
  };

  // Filter restaurants based on selected category
  const filteredRestaurants = (() => {
    if (!selectedCategory) return restaurants;
    return restaurants;
  })();

  // Filter menu items by selected category
  const filteredMenuItems = selectedCategory
    ? allMenuItems.filter(item => {
        const categoryId = typeof item.category === 'object' ? item.category?.id : item.category;
        return categoryId === selectedCategory;
      })
    : [];

  // Filter categories to only show those with items
  const categoriesWithItemsList = categories.filter(
    cat => categoriesWithItems.has(cat.id)
  );

  // State for last order
  const [lastOrder, setLastOrder] = useState(null);

  // State for rating modal
  const [unratedOrder, setUnratedOrder] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get(API_ENDPOINTS.MENU.CATEGORIES);
        const cats = response.data.results || [];
        setCategories(cats);
      } catch (err) {
        logError(err, { context: 'Home.fetchCategories' });
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        if (!currentLocation?.latitude || !currentLocation?.longitude) {
          setRestaurants([]);
          setError(null);
          setCategoriesWithItems(new Set());
          return;
        }

        const data = await buyerRestaurants.listRestaurants(currentLocation.latitude, currentLocation.longitude);
        const list = Array.isArray(data) ? data : data.results || [];
        setRestaurants(list);
        setError(null);

        // Determine which categories have items and collect all menu items
        try {
          const usedCategories = new Set();
          const allItems = [];

          for (const restaurant of list) {
            const menuItems = await buyerMenu.getMenuItems(restaurant.id);
            const items = Array.isArray(menuItems) ? menuItems : menuItems.results || [];

            items.forEach(item => {
              const categoryId = typeof item.category === 'object' ? item.category?.id : item.category;
              if (categoryId !== null && categoryId !== undefined) {
                usedCategories.add(categoryId);
              }
              allItems.push({
                ...item,
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                restaurant_image: restaurant.image,
              });
            });
          }

          setAllMenuItems(allItems);
          setCategoriesWithItems(usedCategories);
        } catch (err) {
          logError(err, { context: 'Home.determineCategoriesWithItems' });
          setAllMenuItems([]);
          setCategoriesWithItems(new Set());
        }
      } catch (err) {
        logError(err, { context: 'Home.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [currentLocation]);

  // Helper: Calculate time since order was delivered/completed
  const getTimeSinceDelivery = (order) => {
    const timestamp = order.completed_at || order.delivered_at || order.created_at;
    if (!timestamp) return null;
    const deliveredTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - deliveredTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hour${Math.floor(diffHours) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays)} day${Math.floor(diffDays) > 1 ? 's' : ''} ago`;
  };

  // Helper: Check if order is within 24 hours
  const isWithin24Hours = (order) => {
    const timestamp = order.completed_at || order.delivered_at || order.created_at;
    if (!timestamp) return false;
    const deliveredTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - deliveredTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < 24;
  };

  // Helper: Get dismissed order IDs from localStorage
  const getDismissedOrderIds = () => {
    try {
      const dismissed = localStorage.getItem('dismissed_rating_orders');
      return dismissed ? JSON.parse(dismissed) : [];
    } catch {
      return [];
    }
  };

  // Fetch last order on mount
  useEffect(() => {
    const fetchLastOrder = async () => {
      if (!user) return;
      try {
        const orders = await buyerOrders.listOrders();
        if (orders && orders.length > 0) {
          setLastOrder(orders[0]);
          
          // Show rating popup only if:
          // 1. Order is delivered and not rated
          // 2. Order is within 24 hours
          // 3. Order hasn't been dismissed
          const order = orders[0];
          const dismissedIds = getDismissedOrderIds();
          
          if (
            order.status === 'delivered' &&
            !order.is_rated &&
            isWithin24Hours(order) &&
            !dismissedIds.includes(order.id)
          ) {
            setUnratedOrder(order);
          }
        }
      } catch (err) {
        logError(err, { context: 'Home.fetchLastOrder' });
      }
    };

    fetchLastOrder();
  }, [user]);

  const closePopup = () => {
    // Store dismissed order ID in localStorage
    if (unratedOrder?.id) {
      const dismissedIds = getDismissedOrderIds();
      if (!dismissedIds.includes(unratedOrder.id)) {
        dismissedIds.push(unratedOrder.id);
        localStorage.setItem('dismissed_rating_orders', JSON.stringify(dismissedIds));
      }
    }
    setUnratedOrder(null);
  };
  const openRateModal = () => setIsRatingOpen(true);

  // Handle reorder
  const handleReorder = (order) => {
    try {
      if (!order || !order.items || order.items.length === 0) {
        alert('❌ No items in this order');
        return;
      }

      let addedCount = 0;

      order.items.forEach((orderItem) => {
        try {
          if (!orderItem.menu_item) return;

          const menuItem = {
            id: orderItem.menu_item.id,
            name: orderItem.menu_item.name,
            price: parseFloat(orderItem.menu_item.price) || 0,
            image: orderItem.menu_item.image,
            vendorId: order.restaurant,
          };

          const quantity = parseInt(orderItem.quantity) || 1;

          addLocalItem({ ...menuItem, vendorId: order.restaurant, quantity });
          addedCount++;
        } catch (err) {
          logError(err, { context: 'Home.handleReorder.addItem' });
        }
      });

      if (addedCount === 0) {
        alert('❌ Failed to add items to cart');
        return;
      }

      alert(`✅ Added ${addedCount} item(s) to cart!`);
      setTimeout(() => navigate(`/checkout/${order.restaurant}`), 300);
    } catch (err) {
      logError(err, { context: 'Home.handleReorder' });
      alert('Failed to reorder. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted">Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-20 sm:pb-24 md:pb-20">

      {/* 1. Header Section */}
      <section className="px-4 sm:px-6 md:px-8 pt-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark mb-1">
          {user ? `Hello, ${user.name?.split(' ')[0] || user.username} 👋` : "Are you hungry? 😋"}
        </h1>
        <div className="text-sm sm:text-base text-muted mb-4">
          {user ? "Ready to order your favorites?" : "Let's get you something to eat."}
        </div>
        <div
          onClick={handleSearchClick}
          className="cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
        >
          <Input
            placeholder="Search jollof, chicken, drinks..."
            readOnly
          />
        </div>
      </section>

      {/* 2. Retention Loop (Only if Logged In and Within 24 Hours) */}
      {user && lastOrder && isWithin24Hours(lastOrder) && (
        <section className="animate-in slide-in-from-top duration-500 px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-dark text-lg sm:text-xl">Order Again</h2>
            <span
              className="text-xs text-primary font-bold cursor-pointer hover:underline"
              onClick={() => navigate('/history')}
            >
              See all
            </span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center">
            <img
              src={lastOrder.items?.[0]?.menu_item?.image || 'https://via.placeholder.com/64'}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              alt="Last order"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-dark truncate">{lastOrder.items?.[0]?.menu_item?.name}</h4>
              <p className="text-xs text-muted truncate">{lastOrder.restaurant_name}</p>
            </div>
            <button
              onClick={() => handleReorder(lastOrder)}
              className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center justify-center"
            >
              Reorder
            </button>
          </div>
        </section>
      )}

      {/* 3. Promo Banner (Only if NOT Logged In) */}
      {!user && (
        <div
          className="mx-4 sm:mx-6 md:mx-8 h-32 sm:h-40 bg-gradient-to-r from-primary to-blue-400 rounded-xl sm:rounded-2xl flex items-center px-4 sm:px-6 text-white relative overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform"
          onClick={() => navigate('/signup')}
        >
          <div className="z-10">
            <h2 className="text-2xl sm:text-3xl font-bold">50% OFF</h2>
            <p className="font-medium text-sm sm:text-base">On your first order!</p>
          </div>
          <div className="absolute -right-5 -bottom-10 w-40 h-40 bg-white/20 rounded-full" />
        </div>
      )}

      {/* 4. Menu Categories Section - Hide if no restaurants */}
      {!(categoriesLoading && categoriesWithItemsList.length === 0) && restaurants.length > 0 && (
        <section className="py-2">
          <div className="px-4 sm:px-6 md:px-8 flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg sm:text-xl md:text-2xl text-gray-800">What's on your mind?</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-4 sm:px-6 md:px-8">
            {categoriesLoading ? (
              // Skeleton
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              ))
            ) : (
              categoriesWithItemsList.map((category) => {
                const isActive = category.id === selectedCategory;
                const { icon: Icon, bg, color } = getCategoryIcon(category.icon);

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(isActive ? null : category.id)}
                    className="flex-shrink-0 group flex flex-col items-center w-20 transition-transform active:scale-90"
                  >
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border ${
                        isActive
                          ? 'bg-primary border-primary shadow-lg shadow-primary/30 scale-105'
                          : `${bg} border-gray-100 hover:border-primary/30`
                      }`}
                    >
                      <Icon
                        size={30}
                        className={isActive ? 'text-white' : color}
                      />
                    </div>
                    <span
                      className={`mt-2 text-[11px] sm:text-xs font-bold text-center line-clamp-1 transition-colors ${
                        isActive ? 'text-primary' : 'text-gray-500'
                      }`}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* 4.5. Filtered Menu Items by Category */}
      {selectedCategory && filteredMenuItems.length > 0 && (
        <section className="px-4 sm:px-6 md:px-8">
          <h2 className="font-bold text-lg sm:text-xl md:text-2xl mb-4">
            {categories.find(c => c.id === selectedCategory)?.name || 'Items'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              >
                {item.image && (
                  <div className="w-full h-40 overflow-hidden bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-dark truncate">{item.name}</h3>
                  <p className="text-xs text-muted truncate mb-2">{item.restaurant_name}</p>
                  {item.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">₦{parseFloat(item.price).toLocaleString()}</span>
                    <span className={`text-xs font-bold ${item.available ? 'text-green-600' : 'text-red-600'}`}>
                      {item.available ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Nearby Restaurants - Only show if restaurants exist */}
      {restaurants.length > 0 ? (
        <section className="px-4 sm:px-6 md:px-8">
          <h2 className="font-bold text-lg sm:text-xl md:text-2xl mb-4">Nearby Restaurants</h2>

          {!currentLocation ? (
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center border border-gray-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-orange-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-dark mb-2">Delivery Location Required</h3>
              <p className="text-sm text-muted mb-6">Set your delivery location to see nearby restaurants and place orders.</p>
              <button
                onClick={() => openLocationSetup()}
                className="bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors w-full sm:w-auto min-h-[44px]"
              >
                Set Location
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="animate-in fade-in">
                    <RestaurantCard
                      id={restaurant.id}
                      name={restaurant.name}
                      image={restaurant.image}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ) : !currentLocation ? (
        <section className="px-4 sm:px-6 md:px-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-orange-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-dark mb-2">Delivery Location Required</h3>
            <p className="text-sm text-muted mb-6">Set your delivery location to see nearby restaurants and place orders.</p>
            <button
              onClick={() => openLocationSetup()}
              className="bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors w-full sm:w-auto min-h-[44px]"
            >
              Set Location
            </button>
          </div>
        </section>
      ) : (
        <section className="px-4 sm:px-6 md:px-8">
          <NoVendorsEmptyState 
            latitude={currentLocation.latitude}
            longitude={currentLocation.longitude}
            address={currentLocation.address}
          />
        </section>
      )}

      {/* 6. Rating Popup */}
      {unratedOrder && (
        <div className="fixed bottom-20 sm:bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-500">
          <div className="bg-dark text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 relative border border-gray-700">
            <button
              onClick={closePopup}
              className="absolute -top-2 -right-2 bg-gray-600 text-white rounded-full p-1 hover:bg-gray-500 shadow-sm"
            >
              <X size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Delivered {getTimeSinceDelivery(unratedOrder)}</p>
              <p className="font-bold text-sm">How was {unratedOrder.restaurant?.name}?</p>
            </div>
            <button
              onClick={openRateModal}
              className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary-hover whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center gap-2"
            >
              <Star size={14} fill="currentColor" />
              Rate
            </button>
          </div>
        </div>
      )}

      {/* 7. Rating Modal */}
      <RateOrderModal
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        order={unratedOrder}
        onSubmit={(data) => {
          console.log("Rating submitted:", data);
          setIsRatingOpen(false);
          setUnratedOrder(null);
        }}
      />

    </div>
  );
};

export default BuyerHome;