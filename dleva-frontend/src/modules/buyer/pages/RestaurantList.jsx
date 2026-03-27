import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, MapPin, X, UtensilsCrossed } from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import buyerRestaurants from '../../../services/buyerRestaurants';
import useLocationContext from '../../../hooks/useLocation';
import { logError } from '../../../utils/errorHandler';

// ─── No Location Screen ──────────────────────────────────────────────────────

const NoLocationScreen = ({ onSetLocation, onBack }) => (
  <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-2">
      <MapPin size={36} className="text-primary" />
    </div>
    <h2 className="text-xl font-bold text-dark">Set Your Location</h2>
    <p className="text-sm text-muted max-w-xs">
      We need your location to show nearby restaurants and food
    </p>
    <div className="w-full max-w-xs space-y-3 mt-2">
      <button
        onClick={onSetLocation}
        className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-colors"
      >
        Set Location
      </button>
      <button
        onClick={onBack}
        className="w-full py-4 border-2 border-gray-200 text-dark rounded-2xl font-bold text-sm hover:border-gray-300 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const RestaurantList = () => {
  const navigate = useNavigate();
  const { currentLocation, openLocationSetup } = useLocationContext();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch restaurants
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
        setRestaurants(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } catch (err) {
        logError(err, { context: 'RestaurantList.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [currentLocation]);

  // Filter by search
  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }, [restaurants, searchQuery]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted">Finding restaurants near you...</p>
      </div>
    );
  }

  // ── No location ──
  if (!currentLocation) {
    return (
      <NoLocationScreen
        onSetLocation={openLocationSetup}
        onBack={() => navigate('/home')}
      />
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <UtensilsCrossed size={24} className="text-red-400" />
        </div>
        <p className="font-bold text-dark">{error}</p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen pb-24">

      {/* ── Page Header ── */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-dark mb-4">Restaurants</h1>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded-2xl border border-gray-100 shadow-sm">
          <Search size={16} className="text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-dark placeholder-muted focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted hover:text-dark transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Results count ── */}
      {searchQuery && (
        <p className="px-4 pt-3 text-xs text-muted font-medium">
          {filteredRestaurants.length} result{filteredRestaurants.length !== 1 ? 's' : ''} for "{searchQuery}"
        </p>
      )}

      {/* ── Restaurant Grid ── */}
      <div className="px-4 pt-4">
        {filteredRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Search size={22} className="text-muted" />
            </div>
            <p className="font-bold text-dark mb-1">No restaurants found</p>
            <p className="text-sm text-muted">
              {searchQuery
                ? `No matches for "${searchQuery}"`
                : 'No restaurants near your location'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm text-primary font-bold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                id={restaurant.id}
                name={restaurant.name}
                image={restaurant.image}
                rating={restaurant.rating}
                delivery_time={restaurant.delivery_time}
                is_open={restaurant.is_open}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default RestaurantList;