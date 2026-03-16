import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { X, Star, MapPin } from 'lucide-react';
import Input from '../../../components/ui/Input';
import RestaurantCard from "../components/RestaurantCard";
import RateOrderModal from '../components/RateOrderModal';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import useLocation from '../../../hooks/useLocation';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerOrders from '../../../services/buyerOrders';
import { useCart } from '../../../modules/buyer/context/CartContext';
import { logError } from '../../../utils/errorHandler';

// derive categories from API-backed restaurants (fallback to "All")
const BuyerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLocation, setLocationSelectorOpen } = useLocation(); // Phase 3: Location context
  const { addLocalItem } = useCart(); // ✅ FIXED: Use addLocalItem instead

  // State for restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['All']);

  // selected category for filtering
  const [selectedCategory, setSelectedCategory] = useState('All');
  const handleCategorySelect = (cat) => setSelectedCategory(cat);
  const [searchQuery, setSearchQuery] = useState('');

  // filtered restaurants based on selected category and search query
  const filteredRestaurants = restaurants.filter(r => {
    const matchesCategory = selectedCategory === 'All' || (r.category || '').trim() === selectedCategory;
    if (!searchQuery) return matchesCategory;
    const hay = `${r.name || ''} ${r.description || ''}`.toLowerCase();
    const needle = searchQuery.trim().toLowerCase();
    const matchesSearch = hay.includes(needle);
    return matchesCategory && matchesSearch;
  });
  
  // State for last order
  const [lastOrder, setLastOrder] = useState(null);

  // State for rating modal
  const [unratedOrder, setUnratedOrder] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        // Use location from context; if not set, don't fetch
        if (!currentLocation?.latitude || !currentLocation?.longitude) {
          setRestaurants([]);
          setError(null);
          return;
        }

        const data = await buyerRestaurants.listRestaurants(currentLocation.latitude, currentLocation.longitude);
        const list = Array.isArray(data) ? data : data.results || [];
        setRestaurants(list);
        setError(null);
      } catch (err) {
        logError(err, { context: 'Home.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [currentLocation]);

  // derive categories from fetched restaurants
  useEffect(() => {
    if (!restaurants || restaurants.length === 0) {
      setCategories(['All']);
      return;
    }
    const cats = restaurants
      .map(r => (r.category || '').trim())
      .filter(Boolean);
    const unique = Array.from(new Set(cats));
    setCategories(['All', ...unique]);
  }, [restaurants]);

  // Fetch last order on mount
  useEffect(() => {
    const fetchLastOrder = async () => {
      if (!user) return;
      try {
        const orders = await buyerOrders.listOrders();
        console.log('📦 Fetched orders:', orders); // ✅ DEBUG
        
        if (orders && orders.length > 0) {
          console.log('Last order:', orders[0]); // ✅ DEBUG
          setLastOrder(orders[0]);
          // Check if order is unrated
          if (orders[0].status === 'delivered' && !orders[0].is_rated) {
            setUnratedOrder(orders[0]);
          }
        }
      } catch (err) {
        logError(err, { context: 'Home.fetchLastOrder' });
      }
    };

    fetchLastOrder();
  }, [user]);

  const closePopup = () => setUnratedOrder(null);
  const openRateModal = () => setIsRatingOpen(true);

  // Handle reorder - add items directly to cart
  const handleReorder = (order) => {
    try {
      if (!order || !order.items || order.items.length === 0) {
        alert('❌ No items in this order');
        return;
      }

      console.log('🔄 Reordering from order:', order.id);
      console.log('Order data:', order);

      let addedCount = 0;
      let errors = [];

      // Add each item from previous order to cart
      order.items.forEach((orderItem) => {
        try {
          if (!orderItem.menu_item) {
            console.warn('⚠️ Skipping item - no menu_item data:', orderItem);
            return;
          }

          const menuItem = {
            id: orderItem.menu_item.id,
            name: orderItem.menu_item.name,
            price: parseFloat(orderItem.menu_item.price) || 0,
            image: orderItem.menu_item.image,
            vendorId: order.restaurant, // ✅ Add vendorId here
          };

          const quantity = parseInt(orderItem.quantity) || 1;

          console.log('Adding to cart:', {
            item: menuItem.name,
            vendorId: order.restaurant,
            quantity,
          });

          // ✅ FIXED: Use addLocalItem with correct structure
          addLocalItem({
            ...menuItem,
            vendorId: order.restaurant,
            quantity,
          });
          
          addedCount++;
        } catch (err) {
          logError(err, { context: 'Home.handleReorder.addItem' });
          errors.push(err.message);
        }
      });

      if (addedCount === 0) {
        alert('❌ Failed to add items to cart');
        return;
      }

      alert(`✅ Added ${addedCount} item(s) to cart!`);
      
      // Go to checkout directly for convenience
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
        <p className="text-sm sm:text-base text-muted mb-4">
          {user ? "Ready to order your favorites?" : "Let's get you something to eat."}
        </p>
        <div className="space-y-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jollof, chicken, drinks..."
          />
        </div>
      </section>

      {/* 2. Retention Loop (Only if Logged In) */}
      {user && lastOrder && (
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
          <div className="absolute -right-5 -bottom-10 w-40 h-40 bg-white/20 rounded-full"></div>
        </div>
      )}

      {/* 4. Categories */}
      <section className="px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg sm:text-xl md:text-2xl">Categories</h2>
          <button 
            onClick={() => navigate('/restaurants')}
            className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-300 min-h-[44px] flex items-center justify-center"
          >
            See all
          </button>
        </div>
        
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 scrollbar-hide">
          {categories.map((cat, index) => {
            const active = cat === selectedCategory;
            return (
              <button
                key={cat + index}
                onClick={() => handleCategorySelect(cat)}
                aria-pressed={active}
                className={`whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none min-h-[44px] flex items-center justify-center ${
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Restaurants from API */}
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
              onClick={() => setLocationSelectorOpen(true)}
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
            {restaurants.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p>No restaurants found near you</p>
              </div>
            ) : (
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
            )}
          </>
        )}
      </section>

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
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Delivered Just Now</p>
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