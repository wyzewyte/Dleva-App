import { useEffect, useMemo, useState } from 'react';
import { Clock3, Dot, MapPin, Search, Star, Store, Truck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantWithItemsCard from '../components/RestaurantWithItemsCard';
import useLocation from '../../../hooks/useLocation';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerMenu from '../../../services/buyerMenu';
import searchHistory from '../../../services/searchHistory';
import { logError } from '../../../utils/errorHandler';
import { formatCurrency } from '../../../utils/formatters';
import {
  BuyerCard,
  BuyerEmptyState,
  BuyerFeedbackState,
  BuyerPageHeader,
  BuyerPrimaryButton,
  BuyerSearchField,
  BuyerSegmentedTabs,
  BuyerStatusBadge,
} from '../components/ui/BuyerPrimitives';

const STARTING_DELIVERY_FEE = 500;

const SearchRestaurantRow = ({ restaurant, onClick }) => {
  const imageUrl =
    restaurant.image && !restaurant.image.startsWith('http')
      ? `${import.meta.env.VITE_BASE_URL}${restaurant.image}`
      : restaurant.image || null;
  const isOpen = restaurant.is_open ?? restaurant.is_active ?? true;
  const deliveryFee = Number(restaurant.delivery_fee) > 0 ? Number(restaurant.delivery_fee) : STARTING_DELIVERY_FEE;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-gray-100 px-1 py-4 text-left last:border-0"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={restaurant.name} className="h-20 w-20 flex-shrink-0 rounded-[16px] object-cover" />
      ) : (
        <div className="h-20 w-20 flex-shrink-0 rounded-[16px] bg-gray-100" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-lg font-semibold text-dark">{restaurant.name}</h3>
          <BuyerStatusBadge
            status={isOpen ? 'open' : 'closed'}
            className="shrink-0 border border-gray-200 bg-white shadow-sm"
          >
            {isOpen ? 'Open' : 'Closed'}
          </BuyerStatusBadge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {deliveryFee != null ? (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <Truck size={14} className="text-primary" />
              <span>{`From ${formatCurrency(deliveryFee)}`}</span>
            </span>
          ) : null}
          {deliveryFee != null && restaurant.delivery_time ? <Dot size={14} className="text-gray-300" /> : null}
          {restaurant.delivery_time ? (
            <span className="text-muted">{restaurant.delivery_time} min</span>
          ) : null}
          {restaurant.rating ? <Dot size={14} className="text-gray-300" /> : null}
          {restaurant.rating ? (
            <span className="inline-flex items-center gap-1 text-dark">
              <Star size={14} fill="currentColor" className="text-amber-400" />
              {restaurant.rating}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
};

const SearchModern = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentLocation, openLocationSetup } = useLocation();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recentSearches, setRecentSearches] = useState([]);
  const [restaurantResults, setRestaurantResults] = useState([]);
  const [restaurantsWithItems, setRestaurantsWithItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

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
        const data = await buyerRestaurants.listRestaurants(currentLocation.latitude, currentLocation.longitude);
        const list = Array.isArray(data) ? data : data.results || [];
        setRestaurants(list);
        setCategories(Array.from(new Set(list.map((restaurant) => (restaurant.category || '').trim()).filter(Boolean))));
        setError(null);
      } catch (err) {
        logError(err, { context: 'SearchModern.fetchRestaurants' });
        setError(err.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [currentLocation]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setRestaurantResults([]);
      setRestaurantsWithItems([]);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const restaurantMatches = restaurants.filter((restaurant) => {
      const matchesCategory = selectedCategory === 'All' || (restaurant.category || '').trim() === selectedCategory;
      return matchesCategory && `${restaurant.name || ''} ${restaurant.description || ''}`.toLowerCase().includes(query);
    });

    const fetchMatchingItems = async () => {
      try {
        setSearching(true);
        const data = await buyerMenu.getAllMenuItems();
        let allMenuItems = Array.isArray(data) ? data : data.results || [];
        allMenuItems = allMenuItems.filter((item) => {
          const matchesCategory = selectedCategory === 'All' || (item.category || '').trim() === selectedCategory;
          return matchesCategory && `${item.name || ''} ${item.description || ''}`.toLowerCase().includes(query);
        });

        const groupedByRestaurant = {};
        allMenuItems.forEach((item) => {
          const restaurantId = item.restaurant?.id || item.restaurantId;
          if (!groupedByRestaurant[restaurantId]) {
            groupedByRestaurant[restaurantId] = {
              restaurantId,
              restaurantName: item.restaurant?.name || item.restaurantName,
              restaurantImage: item.restaurant?.image || item.restaurantImage,
              items: [],
            };
          }
          groupedByRestaurant[restaurantId].items.push(item);
        });

        setRestaurantsWithItems(
          Object.values(groupedByRestaurant).map((group) => ({ ...group, items: group.items.slice(0, 2) }))
        );
        setRestaurantResults(restaurantMatches);
      } catch (err) {
        logError(err, { context: 'SearchModern.fetchMatchingItems' });
        setRestaurantsWithItems([]);
        setRestaurantResults(restaurantMatches);
      } finally {
        setSearching(false);
      }
    };

    fetchMatchingItems();
  }, [restaurants, searchQuery, selectedCategory]);

  const allCategories = useMemo(() => ['All', ...categories], [categories]);

  const handleSearch = (query) => {
    if (!query.trim()) return;
    searchHistory.addSearch(query);
    setRecentSearches(searchHistory.getHistory());
  };

  if (!currentLocation && !loading) {
    return (
      <BuyerEmptyState
        icon={<MapPin size={28} />}
        title="Set your location"
        description="Set your delivery location to search for restaurants and items nearby."
        action={<BuyerPrimaryButton onClick={openLocationSetup}>Set Location</BuyerPrimaryButton>}
      />
    );
  }

  if (loading) {
    return (
      <BuyerFeedbackState
        type="loading"
        title="Preparing search"
        message="Loading nearby restaurants and menu items."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <BuyerPageHeader
        title="Search"
      />

      <BuyerSearchField
        value={searchQuery}
        onChange={(event) => {
          const nextValue = event.target.value;
          setSearchQuery(nextValue);
          if (!nextValue.trim()) {
            setRestaurantResults([]);
            setRestaurantsWithItems([]);
          }
        }}
        onClear={() => {
          setSearchQuery('');
          setRestaurantResults([]);
          setRestaurantsWithItems([]);
        }}
        placeholder="Food, drinks, groceries etc"
        className="border-gray-200"
      />

      <div className="overflow-x-auto pb-1">
        <div className="min-w-max pr-2">
          <BuyerSegmentedTabs
            tabs={allCategories.map((category) => ({ id: category, label: category, badge: 0 }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
            className="min-w-max"
          />
        </div>
      </div>

      {!searchQuery ? (
        <div className="space-y-5 pb-6">
          <BuyerCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={16} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-dark">Recent Searches</h2>
            </div>

            {recentSearches.length === 0 ? (
              <p className="text-sm text-muted">Your recent searches will appear here.</p>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => {
                      setSearchQuery(query);
                      handleSearch(query);
                    }}
                    className="flex w-full items-center justify-between rounded-[16px] border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm text-dark transition-colors hover:bg-gray-100"
                  >
                    <span>{query}</span>
                    <Search size={14} className="text-muted" />
                  </button>
                ))}
              </div>
            )}
          </BuyerCard>

          <BuyerCard className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-dark">Browse Restaurants</h2>
              </div>
              {currentLocation?.address ? (
                <span className="truncate text-xs text-muted">{currentLocation.address}</span>
              ) : null}
            </div>
            <div className="divide-y divide-gray-100">
              {restaurants.slice(0, 5).map((restaurant) => (
                <SearchRestaurantRow
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                />
              ))}
            </div>
          </BuyerCard>
        </div>
      ) : searching ? (
        <BuyerFeedbackState
          type="loading"
          title="Searching"
          message={`Looking for restaurants and menu items matching "${searchQuery}".`}
        />
      ) : error ? (
        <BuyerFeedbackState type="error" title="Search failed" message={error} />
      ) : restaurantResults.length === 0 && restaurantsWithItems.length === 0 ? (
        <BuyerEmptyState
          icon={<Search size={28} />}
          title={`No results for "${searchQuery}"`}
          description="Try another search term or switch the category filter."
          action={<BuyerPrimaryButton onClick={() => setSearchQuery('')}>Clear Search</BuyerPrimaryButton>}
        />
      ) : (
        <div className="space-y-6 pb-6">
          {restaurantResults.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-dark">
                  {restaurantResults.length} result{restaurantResults.length === 1 ? '' : 's'} for <span className="text-primary">"{searchQuery}"</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-semibold text-primary"
                >
                  Clear search
                </button>
              </div>
              <BuyerCard className="px-5 py-1">
                {restaurantResults.map((restaurant) => (
                  <SearchRestaurantRow
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  />
                ))}
              </BuyerCard>
            </div>
          ) : null}

          {restaurantsWithItems.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-dark">Matching Items</h2>
              <div className="space-y-5">
                {restaurantsWithItems.map((group, index) => {
                  const restaurantData = restaurants.find((restaurant) => restaurant.id === group.restaurantId) || {
                    id: group.restaurantId,
                    name: group.restaurantName,
                    image: group.restaurantImage,
                  };

                  return (
                    <RestaurantWithItemsCard
                      key={`${group.restaurantId}-${index}`}
                      restaurant={restaurantData}
                      topItems={group.items}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchModern;
