import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Loader2, Search, ChevronDown, Info } from 'lucide-react';
import MenuItem from '../components/MenuItem';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerMenu from '../../../services/buyerMenu';
import { formatCurrency, formatDistance } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';

const GLOBAL_DELIVERY_FEE = 500;

const Menu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const categoryRefs = useRef({});

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Fetch restaurant + menu
  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        const restaurantData = await buyerRestaurants.getRestaurant(id);
        setRestaurant(restaurantData);
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
    if (id) fetchRestaurantAndMenu();
  }, [id]);

  // Collapse header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setHeaderCollapsed(window.scrollY > 160);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Derive categories from menu items
  const categories = [
    { id: 'all', name: 'All' },
    ...Array.from(
      new Map(
        menuItems
          .filter(item => item.category)
          .map(item => {
            const cat = typeof item.category === 'object' ? item.category : { id: item.category, name: item.category_name || 'Other' };
            return [cat.id, cat];
          })
      ).values()
    ),
  ];

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory =
      activeCategory === 'all' ||
      (typeof item.category === 'object' ? item.category?.id : item.category) === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group items by category for display
  const groupedItems = (() => {
    if (activeCategory !== 'all' || searchQuery) {
      return [{ category: null, items: filteredItems }];
    }
    const groups = {};
    menuItems.forEach(item => {
      const catId = typeof item.category === 'object' ? item.category?.id : item.category;
      const catName = typeof item.category === 'object' ? item.category?.name : (item.category_name || 'Other');
      const key = catId || 'other';
      if (!groups[key]) groups[key] = { id: key, name: catName, items: [] };
      groups[key].items.push(item);
    });
    return Object.values(groups);
  })();

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    if (catId !== 'all' && categoryRefs.current[catId]) {
      categoryRefs.current[catId].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted">Loading menu...</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <Info size={24} className="text-red-500" />
        </div>
        <p className="text-base font-bold text-dark">{error || 'Restaurant not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen pb-28">

      {/* ── Hero Image ── */}
      <div className="relative h-56 sm:h-64 md:h-72 bg-gray-200 overflow-hidden">
        <img
          src={restaurant.image || 'https://via.placeholder.com/800x300'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-10"
        >
          <ArrowLeft size={20} className="text-dark" />
        </button>

        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(v => !v)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-10"
        >
          <Search size={18} className="text-dark" />
        </button>

        {/* Restaurant name on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
              {restaurant.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Info Bar ── */}
      <div className="bg-surface border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Rating */}
          {restaurant.rating && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                <Star size={12} fill="white" className="text-white" />
              </div>
              <span className="text-sm font-bold text-dark">{restaurant.rating}</span>
              {restaurant.review_count && (
                <span className="text-xs text-muted">({restaurant.review_count})</span>
              )}
            </div>
          )}

          {/* Delivery time */}
          {restaurant.delivery_time && (
            <div className="flex items-center gap-1.5 text-muted">
              <Clock size={14} />
              <span className="text-xs font-medium">{restaurant.delivery_time} mins</span>
            </div>
          )}

          {/* Delivery fee */}
          <div className="flex items-center gap-1.5 text-muted">
            <MapPin size={14} />
            <span className="text-xs font-medium">
              Delivery: {formatCurrency(GLOBAL_DELIVERY_FEE)}
            </span>
          </div>

          {/* Open status */}
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${
            restaurant.is_open !== false
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-500'
          }`}>
            {restaurant.is_open !== false ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* ── Search Bar (expandable) ── */}
      {showSearch && (
        <div className="bg-surface px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 rounded-xl">
            <Search size={16} className="text-muted flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-dark placeholder-muted focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-muted hover:text-dark">
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Sticky Category Tabs ── */}
      <div className="sticky top-0 bg-surface z-20 border-b border-gray-100 shadow-sm">
        <div className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-dark text-white shadow-sm'
                    : 'bg-gray-100 text-muted hover:text-dark'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Menu Items ── */}
      <div className="px-4 pt-4 space-y-6">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Search size={22} className="text-muted" />
            </div>
            <p className="font-bold text-dark mb-1">No items found</p>
            <p className="text-sm text-muted">Try a different search or category</p>
          </div>
        ) : (
          groupedItems.map(group => (
            <div
              key={group.category?.id || 'all'}
              ref={el => { if (group.category?.id) categoryRefs.current[group.category.id] = el; }}
            >
              {/* Category heading */}
              {group.category && activeCategory === 'all' && !searchQuery && (
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-bold text-dark">{group.category.name}</h2>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-muted font-medium">{group.items.length} items</span>
                </div>
              )}

              {/* Items list */}
              <div className="bg-surface rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {group.items.map(item => (
                  <MenuItem
                    key={item.id}
                    {...item}
                    restaurantId={restaurant.id}
                    restaurantName={restaurant.name}
                    deliveryFee={GLOBAL_DELIVERY_FEE}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default Menu;