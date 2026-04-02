import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import buyerRestaurants from '../../../services/buyerRestaurants';
import useLocationContext from '../../../hooks/useLocation';
import { logError } from '../../../utils/errorHandler';
import {
  BuyerCard,
  BuyerEmptyState,
  BuyerFeedbackState,
  BuyerPageHeader,
  BuyerPrimaryButton,
  BuyerSearchField,
  BuyerSecondaryButton,
} from '../components/ui/BuyerPrimitives';

const RestaurantListModern = () => {
  const navigate = useNavigate();
  const { currentLocation, openLocationSetup } = useLocationContext();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        if (!currentLocation?.latitude || !currentLocation?.longitude) {
          setRestaurants([]);
          setError(null);
          return;
        }

        const data = await buyerRestaurants.listRestaurants(currentLocation.latitude, currentLocation.longitude);
        setRestaurants(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } catch (err) {
        logError(err, { context: 'RestaurantListModern.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [currentLocation]);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter((restaurant) => (
      (restaurant.name || '').toLowerCase().includes(query) ||
      (restaurant.description || '').toLowerCase().includes(query)
    ));
  }, [restaurants, searchQuery]);

  if (!currentLocation && !loading) {
    return (
      <BuyerEmptyState
        icon={<MapPin size={28} />}
        title="Set your location"
        description="We need your delivery location to show nearby restaurants and food options."
        action={<BuyerPrimaryButton onClick={openLocationSetup}>Set Location</BuyerPrimaryButton>}
        secondaryAction={<BuyerSecondaryButton onClick={() => navigate('/home')}>Go Home</BuyerSecondaryButton>}
      />
    );
  }

  if (loading) {
    return (
      <BuyerFeedbackState
        type="loading"
        title="Finding restaurants near you"
        message="Checking your location and loading nearby options."
      />
    );
  }

  if (error) {
    return (
      <BuyerFeedbackState
        type="error"
        title="Could not load restaurants"
        message={error}
        action={<BuyerPrimaryButton onClick={() => navigate('/home')}>Go Home</BuyerPrimaryButton>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <BuyerPageHeader
        title="Restaurants"
      />

      {currentLocation?.address ? (
        <BuyerCard className="px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <p className="truncate text-sm text-dark">{currentLocation.address}</p>
          </div>
        </BuyerCard>
      ) : null}

      <BuyerSearchField
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder="Search restaurants..."
      />

      {searchQuery ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {filteredRestaurants.length} result{filteredRestaurants.length === 1 ? '' : 's'} for "{searchQuery}"
        </p>
      ) : null}

      {filteredRestaurants.length === 0 ? (
        <BuyerEmptyState
          icon={<Search size={28} />}
          title="No restaurants found"
          description={searchQuery ? `We couldn't find a match for "${searchQuery}".` : 'No restaurants are currently available near your location.'}
          action={searchQuery ? <BuyerPrimaryButton onClick={() => setSearchQuery('')}>Clear Search</BuyerPrimaryButton> : null}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
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
    </div>
  );
};

export default RestaurantListModern;
