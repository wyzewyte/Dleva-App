import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import MenuItem from '../components/MenuItem';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerMenu from '../../../services/buyerMenu';
import useLocationContext from '../../../hooks/useLocation'; // Phase 3: Location context (renamed to avoid conflict with react-router's useLocation)
import { useAuth } from '../../auth/context/AuthContext'; // ✅ Import useAuth
import { logError } from '../../../utils/errorHandler';

// Get the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const GLOBAL_DELIVERY_FEE = 500;

const RestaurantList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // ✅ Get user from context
  const { currentLocation, setLocationSelectorOpen } = useLocationContext(); // Phase 3: Location context
  
  // ✅ State for restaurants from API
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedId, setSelectedId] = useState(location.state?.selectedId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);

  // NEW: cache menus per restaurant so we can search food across all restaurants
  const [menuCache, setMenuCache] = useState({}); // { [restaurantId]: [items] }
  const [menuMatchIds, setMenuMatchIds] = useState([]); // restaurant ids that have a matching menu item
  const [searchingMenus, setSearchingMenus] = useState(false);

  // ✅ Fetch restaurants from API
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        
        // Phase 3: Use location from context (LocationManager)
        if (!currentLocation) {
          setError('Please set your location to see restaurants');
          setRestaurants([]);
          return;
        }

        const data = await buyerRestaurants.listRestaurants(
          currentLocation.latitude,
          currentLocation.longitude
        );
        const restaurantList = Array.isArray(data) ? data : data.results || [];
        
        setRestaurants(restaurantList);
        setError(null);
        
        // ✅ Set first restaurant as default if no ID passed
        if (restaurantList.length > 0 && !selectedId) {
          setSelectedId(restaurantList[0].id);
        }
      } catch (err) {
        logError(err, { context: 'RestaurantList.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [currentLocation, selectedId]); // Updated dependency to use currentLocation

  // ✅ Fetch menu items when restaurant is selected
  useEffect(() => {
    if (!selectedId) return;

    const fetchMenu = async () => {
      try {
        setMenuLoading(true);
        const data = await buyerMenu.getMenuItems(selectedId);
        const items = Array.isArray(data) ? data : data.results || [];
        setMenuItems(items);

        // cache the fetched menu for search use
        setMenuCache(prev => ({ ...prev, [selectedId]: items }));
      } catch (err) {
        logError(err, { context: 'RestaurantList.fetchMenu' });
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, [selectedId]);

  // NEW: When searching, ensure we have menus for restaurants and compute which restaurants have matching menu items
  useEffect(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q || restaurants.length === 0) {
      setMenuMatchIds([]);
      return;
    }

    let cancelled = false;
    const findMatches = async () => {
      setSearchingMenus(true);
      const matched = new Set();
      // prepare fetches for restaurants missing in cache
      const fetchPromises = restaurants.map(async (r) => {
        if (!menuCache[r.id]) {
          try {
            const data = await buyerMenu.getMenuItems(r.id);
            const items = Array.isArray(data) ? data : data.results || [];
            if (!cancelled) {
              setMenuCache(prev => ({ ...prev, [r.id]: items }));
            }
            return { id: r.id, items };
          } catch (e) {
            return { id: r.id, items: [] };
          }
        } else {
          return { id: r.id, items: menuCache[r.id] || [] };
        }
      });

      const results = await Promise.all(fetchPromises);
      if (cancelled) return;

      results.forEach(({ id, items }) => {
        const hasMatch = items.some(item => {
          const name = (item.name || '').toLowerCase();
          const desc = (item.description || '').toLowerCase();
          return name.includes(q) || desc.includes(q);
        });
        if (hasMatch) matched.add(id);
      });

      if (!cancelled) {
        setMenuMatchIds(Array.from(matched));
        setSearchingMenus(false);
      }
    };

    findMatches();

    return () => { cancelled = true; };
  }, [searchQuery, restaurants, menuCache]);

  // ✅ Get selected restaurant object
  const selectedRestaurant = restaurants.find(r => r.id === selectedId);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    // You can filter restaurants by name here if needed
  };

  // Filter restaurants by search query (also include restaurants that have matching menu items)
  const filteredRestaurants = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return restaurants;
    const matchedByMenu = new Set(menuMatchIds || []);
    return restaurants.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      const restaurantMatch = name.includes(q) || desc.includes(q) || cat.includes(q);
      const menuMatch = matchedByMenu.has(r.id);
      return restaurantMatch || menuMatch;
    });
  }, [restaurants, searchQuery, menuMatchIds]);

  // If search filters out the selected restaurant, pick the first filtered one (or none)
  useEffect(() => {
    // If there are no restaurants at all, clear selection.
    if (restaurants.length === 0) {
      setSelectedId(null);
      return;
    }

    // When a search yields no matches, keep the current selection instead of clearing it
    // to avoid the UI "dimming" (fade-out) effect. Only auto-select the first result
    // when there are matches and the current selection is not among them.
    if (filteredRestaurants.length === 0) {
      return;
    }

    if (!filteredRestaurants.some(r => r.id === selectedId)) {
      setSelectedId(filteredRestaurants[0].id);
    }
  }, [filteredRestaurants, restaurants, selectedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Phase 3: Show location setup prompt if no location
  if (!currentLocation && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Set Your Location</h2>
          <p className="text-gray-600 mb-6">We need your location to show nearby restaurants</p>
        </div>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setLocationSelectorOpen(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Set Location
          </button>
          <button 
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600 font-bold">{error}</p>
        <button 
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen pb-24 flex flex-col h-screen">
      
      {/* --- TOP SECTION (Fixed/Sticky) --- */}
      <div className="bg-surface shadow-sm z-10 flex-shrink-0">
        
        {/* Search Header */} 
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search for restaurants or food..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-50 py-2.5 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-gray-100"
            />
          </div>
        </div>

        {/* ✅ HORIZONTAL RESTAURANT LIST FROM API */}
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x">
          {(filteredRestaurants.length === 0) ? (
            <p className="text-muted text-sm py-2">No restaurants or food found</p>
          ) : (
            filteredRestaurants.map((res) => {
              const isActive = res.id === selectedId;
              const imageUrl = res.image && !res.image.startsWith('http') ? `${API_BASE_URL}${res.image}` : res.image || 'https://via.placeholder.com/48';
              const subtitle = res.description ? (res.description.length > 40 ? res.description.slice(0, 40) + '…' : res.description) : (res.category || 'Restaurant');
              return (
                <button 
                  key={res.id}
                  onClick={() => setSelectedId(res.id)}
                  className={`
                    flex-shrink-0 snap-center flex items-center gap-3 p-2 rounded-xl border transition-all duration-300
                    ${isActive 
                      ? "bg-primary text-white border-primary shadow-lg scale-105" 
                      : "bg-white text-dark border-gray-200 hover:border-gray-300"
                    }
                  `}
                  style={{minWidth: '220px'}}
                >
                  {/* Tiny Image */}
                  <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden border border-white/20">
                    <img 
                      src={imageUrl} 
                      alt={res.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  {/* Text Info */}
                  <div className="text-left">
                    <h4 className={`text-sm font-bold ${isActive ? "text-white" : "text-dark"}`}>
                      {res.name}
                    </h4>
                    <div className={`text-[10px] ${isActive ? "text-white/80" : "text-muted"}`}>
                      {subtitle}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* --- BOTTOM SECTION (Scrollable Menu) --- */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 md:p-8">
        
        {filteredRestaurants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted">No results found{searchQuery ? ` for "${searchQuery}"` : ''}</p>
          </div>
        ) : selectedRestaurant ? (
           <>
             {/* Selected Restaurant Header */}
             <div className="mb-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-end mb-2 gap-3 flex-wrap">
                 <div className="flex-1 min-w-0">
                   <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-dark">{selectedRestaurant.name} Menu</h2>
                   <p className="text-xs sm:text-sm text-muted">
                     {selectedRestaurant.description || selectedRestaurant.category || 'Restaurant'}
                   </p>
                 </div>
                 <div className="text-xs font-bold text-primary bg-primary/10 px-2 sm:px-3 py-1 rounded-lg whitespace-nowrap">
                   Selected
                 </div>
               </div>
             </div>
 
             {/* ✅ MENU ITEMS FROM API */}
             <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-in slide-in-from-bottom-2 duration-300">
               {menuLoading ? (
                 <div className="bg-white rounded-xl p-8 text-center">
                   <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                   <p className="text-muted text-sm">Loading menu...</p>
                 </div>
               ) : menuItems.length === 0 ? (
                 <div className="bg-white rounded-xl p-8 text-center">
                   <p className="text-muted">No menu items available</p>
                 </div>
               ) : (
                 menuItems.map((item) => (
                   <MenuItem 
                     key={item.id} 
                     {...item} 
                     restaurantId={selectedRestaurant.id}
                     restaurantName={selectedRestaurant.name}
                     deliveryFee={GLOBAL_DELIVERY_FEE}
                   />
                 ))
               )}
             </div>
 
             <div className="h-20"></div>
           </>
         ) : (
           <div className="flex items-center justify-center h-full">
             <p className="text-muted">Select a restaurant</p>
           </div>
         )}
       </div>
 
     </div>
   );
 };
 
 export default RestaurantList;