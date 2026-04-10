import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Dot, MapPin, Search, Star, Store, Trash2, Truck, X, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import BuyerPageLoading from '../components/ui/BuyerPageLoading';

const STARTING_DELIVERY_FEE = 500;
const SEARCH_DEBOUNCE_MS = 350;
const MIN_SEARCH_LENGTH = 2;
const NEARBY_RESTAURANTS_LIMIT = 100;
const RESTAURANT_RESULTS_LIMIT = 12;
const MENU_RESULTS_LIMIT = 40;
const PREVIEW_RESTAURANTS_LIMIT = 6;
const ITEM_RESULTS_LIMIT = 10;
const RESTAURANT_PREVIEW_LIMIT = 5;

const toResultList = (data) => {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
};

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
        <img src={imageUrl} alt={restaurant.name} className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover" />
      ) : (
        <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-gray-100" />
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
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Truck size={14} className="text-primary" />
            <span>{`From ${formatCurrency(deliveryFee)}`}</span>
          </span>
          {restaurant.delivery_time ? <Dot size={14} className="text-gray-300" /> : null}
          {restaurant.delivery_time ? <span className="text-muted">{restaurant.delivery_time} min</span> : null}
          <Dot size={14} className="text-gray-300" />
          <span className="inline-flex items-center gap-1 text-dark">
            <Star size={14} fill="currentColor" className="text-amber-400" />
            {restaurant.rating || 'New'}
          </span>
        </div>
      </div>
    </button>
  );
};

const SearchRowSkeleton = () => (
  <div className="flex animate-pulse items-center gap-4 border-b border-gray-100 px-1 py-4 last:border-0">
    <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-gray-100" />
    <div className="min-w-0 flex-1 space-y-3">
      <div className="h-4 w-2/3 rounded bg-gray-100" />
      <div className="h-3 w-full rounded bg-gray-100" />
      <div className="h-3 w-3/4 rounded bg-gray-100" />
    </div>
  </div>
);

const SearchResultsSkeleton = () => (
  <div className="space-y-5 pb-6">
    <BuyerCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </BuyerCard>

    <div className="space-y-3">
      <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
      <div className="h-52 animate-pulse rounded-[28px] border border-gray-100 bg-white" />
    </div>
  </div>
);

const SearchMenuItemRow = ({ item, onClick }) => {
  const imagePath = item.image?.url || item.image;
  const imageUrl = imagePath
    ? imagePath.startsWith('http')
      ? imagePath
      : `${import.meta.env.VITE_BASE_URL}${imagePath}`
    : null;
  const restaurant = item.restaurantData;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-gray-100 px-1 py-4 text-left last:border-0"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={item.name} className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover" />
      ) : (
        <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-gray-100" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-dark">{item.name}</h3>
            {restaurant?.name ? (
              <p className="mt-1 truncate text-sm text-muted">{restaurant.name}</p>
            ) : null}
          </div>
          <ChevronRight size={16} className="mt-1 shrink-0 text-muted" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-dark">{formatCurrency(item.price)}</span>
          {restaurant?.delivery_time ? <Dot size={14} className="text-gray-300" /> : null}
          {restaurant?.delivery_time ? <span className="text-muted">{restaurant.delivery_time} min</span> : null}
          {restaurant?.rating ? <Dot size={14} className="text-gray-300" /> : null}
          {restaurant?.rating ? (
            <span className="inline-flex items-center gap-1 text-dark">
              <Star size={14} fill="currentColor" className="text-amber-400" />
              {restaurant.rating}
            </span>
          ) : null}
        </div>

        {item.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted">{item.description}</p>
        ) : null}
      </div>
    </button>
  );
};

const SearchModern = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentLocation, openLocationSetup } = useLocation();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [restaurantResults, setRestaurantResults] = useState([]);
  const [menuItemResults, setMenuItemResults] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [baseError, setBaseError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const searchRequestRef = useRef(0);
  const lastSavedQueryRef = useRef('');
  const hasLocation = Boolean(currentLocation?.latitude && currentLocation?.longitude);
  const trimmedQuery = searchQuery.trim();

  useEffect(() => {
    setRecentSearches(searchHistory.getHistory());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await buyerMenu.getCategories();
        if (!cancelled) {
          setCategories(toResultList(data));
        }
      } catch (err) {
        logError(err, { context: 'SearchModern.fetchCategories' });
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchNearbyRestaurants = async () => {
      if (!hasLocation) {
        setNearbyRestaurants([]);
        setBaseError(null);
        setLoadingRestaurants(false);
        return;
      }

      try {
        setLoadingRestaurants(true);
        const data = await buyerRestaurants.listRestaurants(currentLocation.latitude, currentLocation.longitude, {
          limit: NEARBY_RESTAURANTS_LIMIT,
        });
        if (!cancelled) {
          setNearbyRestaurants(toResultList(data));
          setBaseError(null);
        }
      } catch (err) {
        logError(err, { context: 'SearchModern.fetchNearbyRestaurants' });
        if (!cancelled) {
          setNearbyRestaurants([]);
          setBaseError(err.error || 'Failed to load nearby restaurants');
        }
      } finally {
        if (!cancelled) {
          setLoadingRestaurants(false);
        }
      }
    };

    fetchNearbyRestaurants();

    return () => {
      cancelled = true;
    };
  }, [currentLocation, hasLocation]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!trimmedQuery) {
      lastSavedQueryRef.current = '';
    }
  }, [trimmedQuery]);

  const nearbyRestaurantMap = useMemo(
    () => new Map(nearbyRestaurants.map((restaurant) => [String(restaurant.id), restaurant])),
    [nearbyRestaurants]
  );

  useEffect(() => {
    const activeQuery = debouncedQuery.trim();

    if (!activeQuery) {
      setRestaurantResults([]);
      setMenuItemResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    if (activeQuery.length < MIN_SEARCH_LENGTH) {
      setRestaurantResults([]);
      setMenuItemResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    if (!hasLocation || loadingRestaurants) {
      return;
    }

    const requestId = ++searchRequestRef.current;
    const nearbyRestaurantIds = new Set(Array.from(nearbyRestaurantMap.keys()));

    const fetchSearchResults = async () => {
      try {
        setSearching(true);
        setSearchError(null);

        const categoryId = selectedCategory === 'all' ? null : selectedCategory;
        const [menuResult, restaurantResult] = await Promise.allSettled([
          buyerMenu.searchMenu(activeQuery, {
            categoryId,
            limit: MENU_RESULTS_LIMIT,
          }),
          buyerRestaurants.searchNearbyRestaurants(
            activeQuery,
            currentLocation.latitude,
            currentLocation.longitude,
            { limit: RESTAURANT_RESULTS_LIMIT }
          ),
        ]);

        if (requestId !== searchRequestRef.current) {
          return;
        }

        const nextRestaurantResults =
          restaurantResult.status === 'fulfilled' ? toResultList(restaurantResult.value) : [];

        const nextMenuItems =
          menuResult.status === 'fulfilled'
            ? toResultList(menuResult.value).filter((item) => {
                const restaurantId = String(item.restaurant?.id || item.restaurantId || item.restaurant);
                return nearbyRestaurantIds.has(restaurantId);
              })
            : [];

        const rankedMenuItems = nextMenuItems
          .map((item) => {
            const restaurantId = String(item.restaurant?.id || item.restaurantId || item.restaurant);
            return {
              ...item,
              restaurantData: nearbyRestaurantMap.get(restaurantId) || null,
            };
          })
          .filter((item) => item.restaurantData)
          .sort((left, right) => {
            const leftExact = left.name?.toLowerCase() === activeQuery.toLowerCase() ? 1 : 0;
            const rightExact = right.name?.toLowerCase() === activeQuery.toLowerCase() ? 1 : 0;
            if (rightExact !== leftExact) return rightExact - leftExact;

            const leftStarts = left.name?.toLowerCase().startsWith(activeQuery.toLowerCase()) ? 1 : 0;
            const rightStarts = right.name?.toLowerCase().startsWith(activeQuery.toLowerCase()) ? 1 : 0;
            if (rightStarts !== leftStarts) return rightStarts - leftStarts;

            return left.name.localeCompare(right.name);
          })
          .slice(0, ITEM_RESULTS_LIMIT);

        setRestaurantResults(nextRestaurantResults.slice(0, RESTAURANT_PREVIEW_LIMIT));
        setMenuItemResults(rankedMenuItems);

        if (menuResult.status === 'rejected' && restaurantResult.status === 'rejected') {
          setSearchError(menuResult.reason?.error || restaurantResult.reason?.error || 'Search failed');
        } else {
          setSearchError(null);
          if (
            activeQuery.length >= MIN_SEARCH_LENGTH &&
            lastSavedQueryRef.current !== activeQuery.toLowerCase()
          ) {
            searchHistory.addSearch(activeQuery);
            setRecentSearches(searchHistory.getHistory());
            lastSavedQueryRef.current = activeQuery.toLowerCase();
          }
        }
      } catch (err) {
        if (requestId !== searchRequestRef.current) {
          return;
        }

        logError(err, { context: 'SearchModern.fetchSearchResults', query: activeQuery });
        setMenuItemResults([]);
        setRestaurantResults([]);
        setSearchError(err.error || 'Search failed');
      } finally {
        if (requestId === searchRequestRef.current) {
          setSearching(false);
        }
      }
    };

    fetchSearchResults();
  }, [
    currentLocation,
    debouncedQuery,
    hasLocation,
    loadingRestaurants,
    nearbyRestaurantMap,
    selectedCategory,
  ]);

  const allCategories = useMemo(
    () => [
      { id: 'all', label: 'All', badge: 0 },
      ...categories.map((category) => ({
        id: String(category.id),
        label: category.name,
        badge: 0,
      })),
    ],
    [categories]
  );

  const totalItemMatches = menuItemResults.length;

  const saveRecentSearch = (query) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    searchHistory.addSearch(normalizedQuery);
    setRecentSearches(searchHistory.getHistory());
    lastSavedQueryRef.current = normalizedQuery.toLowerCase();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setRestaurantResults([]);
    setMenuItemResults([]);
    setSearchError(null);
  };

  const handleRecentSearchClick = (query) => {
    saveRecentSearch(query);
    setSearchQuery(query);
  };

  const handleRemoveRecentSearch = (query) => {
    searchHistory.removeSearch(query);
    setRecentSearches(searchHistory.getHistory());
  };

  const handleClearRecentSearches = () => {
    searchHistory.clearHistory();
    setRecentSearches([]);
  };

  const handleRestaurantNavigation = (restaurantId) => {
    const activeQuery = searchQuery.trim() || debouncedQuery;
    if (activeQuery) {
      saveRecentSearch(activeQuery);
    }

    navigate(`/restaurant/${restaurantId}`);
  };

  const showLandingState = !trimmedQuery;
  const showNoLocationState = !hasLocation && !loadingRestaurants;
  const showShortQueryState = trimmedQuery.length > 0 && trimmedQuery.length < MIN_SEARCH_LENGTH;
  const showEmptyResults =
    !!debouncedQuery &&
    !searching &&
    !searchError &&
    restaurantResults.length === 0 &&
    menuItemResults.length === 0;

  if (showLandingState && loadingRestaurants && loadingCategories) {
    return <BuyerPageLoading variant="search" />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-6">
      <BuyerPageHeader title="Search" />

      <BuyerSearchField
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onClear={clearSearch}
        placeholder={hasLocation ? 'Search for meals and restaurants' : 'Set location to start searching'}
        readOnly={!hasLocation}
        onClick={!hasLocation ? openLocationSetup : undefined}
        className={!hasLocation ? 'cursor-pointer' : 'border-gray-200'}
      />

      {loadingCategories ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-11 w-24 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="min-w-max pr-2">
            <BuyerSegmentedTabs
              tabs={allCategories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="min-w-max"
            />
          </div>
        </div>
      )}

      {showNoLocationState ? (
        <BuyerEmptyState
          icon={<MapPin size={28} />}
          title="Set your location"
          description="Set your delivery location to search for restaurants and menu items within 5km."
          action={<BuyerPrimaryButton onClick={openLocationSetup}>Set Location</BuyerPrimaryButton>}
        />
      ) : baseError && !trimmedQuery ? (
        <BuyerFeedbackState
          type="error"
          title="Could not load nearby restaurants"
          message={baseError}
          action={<BuyerPrimaryButton onClick={openLocationSetup}>Update Location</BuyerPrimaryButton>}
        />
      ) : showLandingState ? (
        <div className="space-y-5">
          <BuyerCard className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock3 size={16} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-dark">Recent Searches</h2>
              </div>
              {recentSearches.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearRecentSearches}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              ) : null}
            </div>

            {recentSearches.length === 0 ? (
              <p className="text-sm text-muted">Your recent searches will appear here after you search.</p>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((query) => (
                  <div
                    key={query}
                    className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => handleRecentSearchClick(query)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <Search size={14} className="shrink-0 text-muted" />
                      <span className="truncate text-sm text-dark">{query}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecentSearch(query)}
                      aria-label={`Remove ${query} from recent searches`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-white hover:text-dark"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </BuyerCard>

          <BuyerCard className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-dark">Nearby Restaurants</h2>
              </div>
              {currentLocation?.address ? (
                <button
                  type="button"
                  onClick={openLocationSetup}
                  className="max-w-[55%] truncate text-xs text-muted"
                  title={currentLocation.address}
                >
                  {currentLocation.address}
                </button>
              ) : null}
            </div>

            {loadingRestaurants ? (
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SearchRowSkeleton key={index} />
                ))}
              </div>
            ) : nearbyRestaurants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center">
                <p className="text-sm text-dark">No restaurants found within 5km of your current location.</p>
                <p className="mt-1 text-sm text-muted">Try updating your location to see more places nearby.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {nearbyRestaurants.slice(0, PREVIEW_RESTAURANTS_LIMIT).map((restaurant) => (
                  <SearchRestaurantRow
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantNavigation(restaurant.id)}
                  />
                ))}
              </div>
            )}
          </BuyerCard>
        </div>
      ) : showShortQueryState ? (
        <BuyerCard className="p-5">
          <p className="text-sm text-muted">Type at least {MIN_SEARCH_LENGTH} characters to start searching nearby restaurants and menu items.</p>
        </BuyerCard>
      ) : searching || loadingRestaurants ? (
        <SearchResultsSkeleton />
      ) : searchError ? (
        <BuyerFeedbackState type="error" title="Search failed" message={searchError} />
      ) : showEmptyResults ? (
        <BuyerEmptyState
          icon={<Search size={28} />}
          title={`No results for "${debouncedQuery}"`}
          description="Try another search term, change your category, or clear the search to browse nearby restaurants."
          action={<BuyerPrimaryButton onClick={clearSearch}>Clear Search</BuyerPrimaryButton>}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-dark">Search results</h2>
              <p className="mt-1 text-sm text-muted">
                {totalItemMatches > 0 ? `${totalItemMatches} item match${totalItemMatches === 1 ? '' : 'es'}` : 'No item matches'}
                {' • '}
                {restaurantResults.length} restaurant{restaurantResults.length === 1 ? '' : 's'}
                {' • '}
                within 5km for <span className="font-semibold text-primary">"{debouncedQuery}"</span>
              </p>
            </div>
            <button type="button" onClick={clearSearch} className="text-sm font-semibold text-primary">
              Clear
            </button>
          </div>

          {menuItemResults.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-dark">Matching Items</h3>
              <BuyerCard className="px-5 py-1">
                {menuItemResults.map((item) => (
                  <SearchMenuItemRow
                    key={`${item.id}-${item.restaurantData?.id || item.restaurant}`}
                    item={item}
                    onClick={() => handleRestaurantNavigation(item.restaurantData?.id || item.restaurant)}
                  />
                ))}
              </BuyerCard>
            </div>
          ) : null}

          {restaurantResults.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-dark">Matching Restaurants</h3>
              <BuyerCard className="px-5 py-1">
                {restaurantResults.map((restaurant) => (
                  <SearchRestaurantRow
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantNavigation(restaurant.id)}
                  />
                ))}
              </BuyerCard>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchModern;
