import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Clock, Search, Package, MapPin } from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantWithItems from '../components/RestaurantWithItems';
import useLocation from '../../../hooks/useLocation';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerMenu from '../../../services/buyerMenu';
import searchHistory from '../../../services/searchHistory';
import { logError } from '../../../utils/errorHandler';

// ─── Category Icons (SVG illustrations) ─────────────────────────────────────

const categoryConfig = {
  All: {
    bg: 'bg-dark',
    textColor: 'text-white',
    icon: null,
  },
};

// Colored bg per category tile
const tilePalette = [
  'bg-rose-50',
  'bg-emerald-50',
  'bg-violet-100',
  'bg-amber-50',
  'bg-sky-50',
  'bg-orange-50',
  'bg-teal-50',
  'bg-pink-50',
];

// Simple food emoji map for categories
const categoryEmoji = {
  pastries: '🥐',
  healthy: '🍉',
  breakfast: '🍳',
  pizza: '🍕',
  chicken: '🍗',
  rice: '🍚',
  burgers: '🍔',
  drinks: '🥤',
  seafood: '🦞',
  chinese: '🥡',
  default: '🍽️',
};

const getCategoryEmoji = (cat) => {
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(categoryEmoji)) {
    if (key.includes(k)) return v;
  }
  return categoryEmoji.default;
};

// ─── No Location Screen ──────────────────────────────────────────────────────

const NoLocationScreen = ({ onSetLocation }) => (
  <div className="flex flex-col min-h-screen bg-bg pb-20">
    {/* Search bar (disabled) */}
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-2xl">
        <Search size={18} className="text-muted flex-shrink-0" />
        <span className="text-sm text-muted">Food, drinks, groceries etc</span>
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <MapPin size={28} className="text-primary" />
        </div>
        <h3 className="text-lg font-bold text-dark mb-2">Set your location</h3>
        <p className="text-sm text-muted mb-6">
          Set your delivery location to search for restaurants and food nearby.
        </p>
        <button
          onClick={onSetLocation}
          className="bg-primary text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-primary-hover transition-colors"
        >
          Set Location
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const BuyerSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentLocation, openLocationSetup } = useLocation();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recentSearches, setRecentSearches] = useState([]);
  const [restaurantResults, setRestaurantResults] = useState([]);
  const [restaurantsWithItems, setRestaurantsWithItems] = useState([]); // Group restaurants with matching items

  useEffect(() => {
    setRecentSearches(searchHistory.getHistory());
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        if (!currentLocation?.latitude || !currentLocation?.longitude) {
          setRestaurants([]);
          setError(null);
          return;
        }
        const data = await buyerRestaurants.listRestaurants(
          currentLocation.latitude,
          currentLocation.longitude
        );
        const list = Array.isArray(data) ? data : data.results || [];
        setRestaurants(list);
        setError(null);
      } catch (err) {
        logError(err, { context: 'Search.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [currentLocation]);

  useEffect(() => {
    if (!restaurants || restaurants.length === 0) {
      setCategories([]);
      return;
    }
    const cats = restaurants
      .map(r => (r.category || '').trim())
      .filter(Boolean);
    setCategories(Array.from(new Set(cats)));
  }, [restaurants]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setRestaurantResults([]);
      setRestaurantsWithItems([]);
      return;
    }
    const query = searchQuery.trim().toLowerCase();

    // Filter restaurants by name/description
    const restaurantMatches = restaurants.filter(r => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (r.category || '').trim() === selectedCategory;
      return (
        matchesCategory &&
        `${r.name || ''} ${r.description || ''}`.toLowerCase().includes(query)
      );
    });

    // Fetch menu items and group by restaurant
    const fetchMenuItems = async () => {
      try {
        // Get all menu items (search across all restaurants)
        const data = await buyerMenu.getAllMenuItems();
        let allMenuItems = Array.isArray(data) ? data : (data.results || []);
        
        // Filter by search query and category
        allMenuItems = allMenuItems.filter(item => {
          const matchesCategory =
            selectedCategory === 'All' ||
            (item.category || '').trim() === selectedCategory;
          
          return (
            matchesCategory &&
            `${item.name || ''} ${item.description || ''}`.toLowerCase().includes(query)
          );
        });

        // Group items by restaurant
        const itemsByRestaurant = {};
        allMenuItems.forEach(item => {
          const restaurantId = item.restaurant?.id || item.restaurantId;
          if (!itemsByRestaurant[restaurantId]) {
            itemsByRestaurant[restaurantId] = {
              restaurantId,
              restaurantName: item.restaurant?.name || item.restaurantName,
              restaurantImage: item.restaurant?.image || item.restaurantImage,
              items: [],
            };
          }
          itemsByRestaurant[restaurantId].items.push(item);
        });

        // Convert to array and get top 2 items per restaurant
        const grouped = Object.values(itemsByRestaurant)
          .map(group => ({
            ...group,
            items: group.items.slice(0, 2), // Top 2 items
          }))
          .filter(group => group.items.length > 0); // Only restaurants with matching items

        setRestaurantsWithItems(grouped);
      } catch (err) {
        logError(err, { context: 'Search.fetchMenuItems' });
        setRestaurantsWithItems([]);
      }
    };

    fetchMenuItems();
    setRestaurantResults(restaurantMatches);
  }, [searchQuery, restaurants, selectedCategory]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchHistory.addSearch(searchQuery);
      setRecentSearches(searchHistory.getHistory());
    }
  };

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    searchHistory.addSearch(query);
    setRecentSearches(searchHistory.getHistory());
  };

  const handleRemoveRecent = (e, query) => {
    e.stopPropagation();
    searchHistory.removeSearch(query);
    setRecentSearches(searchHistory.getHistory());
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all search history?')) {
      searchHistory.clearHistory();
      setRecentSearches([]);
    }
  };

  if (!currentLocation) {
    return <NoLocationScreen onSetLocation={openLocationSetup} />;
  }

  const allCategories = ['All', ...categories];

  return (
    <div className="flex flex-col min-h-screen bg-bg pb-20 md:pb-6">

      {/* ── Search Bar ── */}
      <div className="px-4 pt-4 pb-3 bg-bg">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-2xl">
          <Search size={18} className="text-muted flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Food, drinks, groceries etc"
            className="flex-1 bg-transparent text-sm text-dark placeholder-muted focus:outline-none"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted hover:text-dark transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Pill Filters ── */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {allCategories.map((cat, index) => {
          const isActive = cat === selectedCategory;
          return (
            <button
              key={cat + index}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-dark text-white shadow-sm'
                  : 'bg-gray-100 text-muted hover:text-dark'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-4">

        {!searchQuery ? (
          // ── Default View: Categories + Recent Searches ──
          <div className="space-y-6 pt-2 pb-6">

            {/* Category Grid */}
            {categories.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-dark mb-3">Categories</h2>
                <div className="grid grid-cols-4 gap-3">
                  {categories.map((cat, index) => {
                    const bg = tilePalette[index % tilePalette.length];
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSearchQuery(cat);
                        }}
                        className={`${bg} rounded-2xl p-3 flex flex-col items-center justify-center gap-2 aspect-square hover:scale-105 active:scale-95 transition-transform`}
                      >
                        <span className="text-2xl leading-none">
                          {getCategoryEmoji(cat)}
                        </span>
                        <span className="text-[11px] font-semibold text-dark text-center leading-tight truncate w-full">
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-dark">Recent searches</h2>
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                    <Clock size={14} className="text-white" />
                  </div>
                </div>
                {recentSearches.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-muted hover:text-dark font-semibold"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <p className="text-sm text-muted py-4">No recent searches</p>
              ) : (
                <div className="space-y-0 divide-y divide-gray-100">
                  {recentSearches.map((query, index) => (
                    <div
                      key={index}
                      onClick={() => handleRecentSearchClick(query)}
                      className="w-full flex items-center justify-between py-3.5 hover:bg-gray-50 rounded-xl px-1 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="text-sm text-dark">{query}</span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveRecent(e, query)}
                        className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // ── Search Results View ──
          <div className="space-y-6 pt-2 pb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted">Searching...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm text-center">
                {error}
              </div>
            ) : restaurantResults.length === 0 && restaurantsWithItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={48} className="text-gray-200 mb-4" />
                <p className="text-base font-bold text-dark mb-1">
                  No results for "{searchQuery}"
                </p>
                <p className="text-sm text-muted">
                  Try searching for something else
                </p>
              </div>
            ) : (
              <>
                {/* Restaurants by direct name search */}
                {restaurantResults.length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-dark mb-3">
                      Restaurants ({restaurantResults.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {restaurantResults.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          id={restaurant.id}
                          name={restaurant.name}
                          image={restaurant.image}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Restaurants with matching menu items */}
                {restaurantsWithItems.length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-dark mb-3">
                      Items found in restaurants ({restaurantsWithItems.length})
                    </h2>
                    <div className="space-y-5">
                      {restaurantsWithItems.map((group, index) => {
                        // Find the full restaurant data for the card
                        const restaurantData = restaurants.find(
                          r => r.id === group.restaurantId
                        ) || {
                          id: group.restaurantId,
                          name: group.restaurantName,
                          image: group.restaurantImage,
                        };

                        return (
                          <RestaurantWithItems
                            key={`${group.restaurantId}-${index}`}
                            restaurant={restaurantData}
                            topItems={group.items}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerSearch;