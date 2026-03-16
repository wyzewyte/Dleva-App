import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Loader2 } from 'lucide-react';
import MenuItem from '../components/MenuItem';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerMenu from '../../../services/buyerMenu';
import { formatCurrency, formatDistance } from '../../../utils/formatters';
import { getMessage } from '../../../constants/messages';
import { logError } from '../../../utils/errorHandler';

const GLOBAL_DELIVERY_FEE = 500;

const Menu = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch restaurant details and menu items
  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        
        // ✅ Use getRestaurant method
        const restaurantData = await buyerRestaurants.getRestaurant(id);
        setRestaurant(restaurantData);

        // Fetch menu items for this restaurant
        const menuData = await buyerMenu.getMenuItems(id);
        setMenuItems(Array.isArray(menuData) ? menuData : menuData.results || []);
        
        setError(null);
      } catch (err) {
        logError(err, { context: 'Menu.fetchRestaurantAndMenu' });
        setError(err.error || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRestaurantAndMenu();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600 font-bold">{error || 'Restaurant not found'}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen pb-24">
      
      {/* Restaurant Image Header */}
      <div className="relative h-48 bg-gray-300">
        <img 
          src={restaurant.image || 'https://via.placeholder.com/400x200'} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-sm z-10 hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Restaurant Info Card */}
      <div className="relative -mt-10 px-4">
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold mb-2">{restaurant.name}</h1>
          <p className="text-xs text-muted">{restaurant.description || restaurant.category || 'Restaurant'}</p>
        </div>
      </div>

      {/* Menu Category Tabs */}
      <div className="sticky top-0 bg-bg z-20 py-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold mr-3 shadow-md">
          All Menu
        </button>
      </div>

      {/* Menu Items - ✅ Correct prop names */}
      <div className="bg-surface mx-4 rounded-xl border border-gray-100 overflow-hidden">
        {menuItems.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <p>No menu items available</p>
          </div>
        ) : (
          menuItems.map((item) => (
            <MenuItem 
              key={item.id} 
              {...item}
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              deliveryFee={GLOBAL_DELIVERY_FEE}
            />
          ))
        )}
      </div>

    </div>
  );
};

export default Menu;