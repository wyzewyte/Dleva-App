import { useEffect, useMemo, useState } from 'react';
import { Clock3, Info, MapPin, Search, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import MenuItem from '../components/MenuItem';
import buyerRestaurants from '../../../services/buyerRestaurants';
import buyerMenu from '../../../services/buyerMenu';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';
import {
  BuyerCard,
  BuyerEmptyState,
  BuyerFeedbackState,
  BuyerPageHeader,
  BuyerSearchField,
  BuyerSegmentedTabs,
  BuyerStatusBadge,
} from '../components/ui/BuyerPrimitives';
import BuyerPageLoading from '../components/ui/BuyerPageLoading';

const FALLBACK_DELIVERY_FEE = 500;

const MenuModern = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        const restaurantData = await buyerRestaurants.getRestaurant(id);
        const menuData = await buyerMenu.getMenuItems(id);
        setRestaurant(restaurantData);
        setMenuItems(Array.isArray(menuData) ? menuData : menuData.results || []);
        setError(null);
      } catch (err) {
        logError(err, { context: 'MenuModern.fetchRestaurantAndMenu' });
        setError(err.error || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRestaurantAndMenu();
  }, [id]);

  const categories = useMemo(() => {
    return [
      { id: 'all', name: 'All' },
      ...Array.from(
        new Map(
          menuItems
            .filter((item) => item.category)
            .map((item) => {
              const category =
                typeof item.category === 'object'
                  ? item.category
                  : { id: item.category, name: item.category_name || 'Other' };
              return [category.id, category];
            })
        ).values()
      ),
    ];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const itemCategory = typeof item.category === 'object' ? item.category?.id : item.category;
      const matchesCategory = activeCategory === 'all' || itemCategory === activeCategory;
      const matchesSearch =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    if (activeCategory !== 'all' || searchQuery) {
      return [{ id: 'filtered', name: null, items: filteredItems }];
    }

    const groups = {};
    menuItems.forEach((item) => {
      const categoryId = typeof item.category === 'object' ? item.category?.id : item.category;
      const categoryName = typeof item.category === 'object' ? item.category?.name : item.category_name || 'Other';
      const key = categoryId || 'other';

      if (!groups[key]) groups[key] = { id: key, name: categoryName, items: [] };
      groups[key].items.push(item);
    });

    return Object.values(groups);
  }, [activeCategory, filteredItems, menuItems, searchQuery]);

  if (loading) {
    return <BuyerPageLoading variant="menu" />;
  }

  if (error || !restaurant) {
    return (
      <BuyerFeedbackState
        type="error"
        title="Could not load menu"
        message={error || 'Restaurant not found'}
      />
    );
  }

  const deliveryFee = Number(restaurant.delivery_fee) > 0 ? Number(restaurant.delivery_fee) : FALLBACK_DELIVERY_FEE;
  const isRestaurantOpen = restaurant.is_open ?? restaurant.is_active ?? true;
  const imageUrl =
    restaurant.image && !restaurant.image.startsWith('http')
      ? `${import.meta.env.VITE_BASE_URL}${restaurant.image}`
      : restaurant.image || null;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <BuyerPageHeader
        title={restaurant.name}
        showBack
        action={
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-surface text-dark transition-colors hover:bg-gray-50"
          >
            <Search size={18} />
          </button>
        }
      />

      {imageUrl ? (
        <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-gray-100">
          <img src={imageUrl} alt={restaurant.name} className="h-60 w-full object-cover" />
        </div>
      ) : null}

      <BuyerCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {restaurant.rating ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-dark">
              <Star size={14} fill="currentColor" className="text-amber-400" />
              <span className="font-semibold">{restaurant.rating}</span>
            </span>
          ) : null}

          {restaurant.delivery_time ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Clock3 size={14} />
              <span>{restaurant.delivery_time} min</span>
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} />
            <span>{formatCurrency(deliveryFee)} delivery</span>
          </span>

          <BuyerStatusBadge status={isRestaurantOpen ? 'open' : 'closed'} className="ml-auto border border-gray-200 bg-white shadow-sm">
            {isRestaurantOpen ? 'Open' : 'Closed'}
          </BuyerStatusBadge>
        </div>
      </BuyerCard>

      <BuyerSearchField
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder="Search menu items"
      />

      <div className="overflow-x-auto pb-1">
        <div className="min-w-max pr-2">
          <BuyerSegmentedTabs
            tabs={categories.map((category) => ({ id: category.id, label: category.name, badge: 0 }))}
            value={activeCategory}
            onChange={setActiveCategory}
            className="min-w-max"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <BuyerEmptyState
          icon={<Search size={24} />}
          title="No menu items found"
          description="Try another category or search term."
        />
      ) : (
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.id} className="space-y-3">
              {group.name ? (
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-dark">{group.name}</h2>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    {group.items.length} item{group.items.length === 1 ? '' : 's'}
                  </span>
                </div>
              ) : null}

              <BuyerCard className="divide-y divide-gray-100">
                {group.items.map((item) => (
                  <MenuItem
                    key={item.id}
                    {...item}
                    restaurantId={restaurant.id}
                    restaurantName={restaurant.name}
                    deliveryFee={deliveryFee}
                  />
                ))}
              </BuyerCard>
            </div>
          ))}
        </div>
      )}

      {!isRestaurantOpen ? (
        <BuyerCard className="border-red-100 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500">
              <Info size={18} />
            </div>
            <div>
              <p className="font-semibold text-red-700">This restaurant is currently closed</p>
              <p className="mt-1 text-sm text-red-600">
                You can still browse the menu, but ordering may not be available right now.
              </p>
            </div>
          </div>
        </BuyerCard>
      ) : null}
    </div>
  );
};

export default MenuModern;
