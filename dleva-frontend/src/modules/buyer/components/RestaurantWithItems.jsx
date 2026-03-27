import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RestaurantCard from './RestaurantCard';

/**
 * RestaurantWithItems
 * Shows a restaurant card with top 2 matching menu items
 */
const RestaurantWithItems = ({ restaurant, topItems = [] }) => {
  const navigate = useNavigate();

  const handleRestaurantClick = () => {
    navigate(`/restaurant/${restaurant.id}`);
  };

  const handleItemClick = (e, itemId) => {
    e.stopPropagation();
    navigate(`/restaurant/${restaurant.id}`);
  };

  return (
    <div className="space-y-3">
      {/* Restaurant Card */}
      <RestaurantCard
        id={restaurant.id}
        name={restaurant.name}
        image={restaurant.image}
      />

      {/* Top Items from this Restaurant */}
      {topItems.length > 0 && (
        <div className="ml-0 space-y-2">
          {topItems.map((item, index) => (
            <button
              key={`${restaurant.id}-item-${index}`}
              onClick={(e) => handleItemClick(e, item.id)}
              className="w-full flex gap-3 p-3 bg-surface rounded-xl border border-gray-100 hover:border-primary hover:shadow-sm transition-all text-left active:scale-[0.99]"
            >
              <img
                src={item.image || 'https://via.placeholder.com/60'}
                alt={item.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="font-semibold text-sm text-dark truncate">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="text-xs text-muted line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
                {item.price && (
                  <p className="text-sm font-bold text-primary mt-1">
                    ₦{parseFloat(item.price).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center">
                <ChevronRight size={16} className="text-muted" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantWithItems;
