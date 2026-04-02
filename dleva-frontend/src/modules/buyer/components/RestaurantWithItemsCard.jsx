import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RestaurantCard from './RestaurantCard';
import { formatCurrency } from '../../../utils/formatters';
import { BuyerCard } from './ui/BuyerPrimitives';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const RestaurantWithItemsCard = ({ restaurant, topItems = [] }) => {
  const navigate = useNavigate();

  const handleItemClick = (event) => {
    event.stopPropagation();
    navigate(`/restaurant/${restaurant.id}`);
  };

  return (
    <div className="space-y-3">
      <RestaurantCard
        id={restaurant.id}
        name={restaurant.name}
        image={restaurant.image}
        rating={restaurant.rating}
        delivery_time={restaurant.delivery_time}
        delivery_fee={restaurant.delivery_fee}
        is_open={restaurant.is_open}
        category={restaurant.category}
      />

      {topItems.length > 0 && (
        <div className="space-y-2">
          {topItems.map((item, index) => (
            <BuyerCard key={`${restaurant.id}-item-${index}`} interactive className="overflow-hidden">
              <button onClick={handleItemClick} className="flex w-full gap-3 p-3 text-left">
                {(item.image?.url || item.image) ? (
                  <img
                    src={(item.image?.url || item.image).startsWith('http') ? (item.image?.url || item.image) : `${API_BASE_URL}${item.image?.url || item.image}`}
                    alt={item.name}
                    className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gray-100" />
                )}
                <div className="min-w-0 flex-1 py-0.5">
                  <h4 className="truncate text-sm font-semibold text-dark">{item.name}</h4>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{item.description}</p>
                  )}
                  {item.price && (
                    <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(item.price)}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center">
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </button>
            </BuyerCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantWithItemsCard;
