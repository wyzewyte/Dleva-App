import { Link } from 'react-router-dom';
import { Clock3, Dot, Star, Truck } from 'lucide-react';
import { BuyerCard, BuyerStatusBadge } from './ui/BuyerPrimitives';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const STARTING_DELIVERY_FEE = 500;

const RestaurantCard = ({ id, name, image, rating, delivery_time, delivery_fee, is_open, is_active, category, cuisine }) => {
  const imageUrl = image && !image.startsWith('http') ? `${API_BASE_URL}${image}` : image || null;
  const isOpen = is_open ?? is_active ?? true;
  const deliveryFee = Number(delivery_fee) > 0 ? Number(delivery_fee) : STARTING_DELIVERY_FEE;

  const metaTag = category || cuisine;

  return (
    <Link to={`/restaurant/${id}`} className="group block">
      <BuyerCard interactive className="h-full overflow-hidden border-gray-200">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <BuyerStatusBadge
              status={isOpen ? 'open' : 'closed'}
              className={cn(
                'border border-gray-200 bg-white shadow-sm',
                isOpen ? 'text-emerald-700' : 'text-red-700'
              )}
            >
              {isOpen ? 'Open' : 'Closed'}
            </BuyerStatusBadge>

            {metaTag ? (
              <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                {metaTag}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 px-4 pb-4 pt-3.5">
          <h3 className="truncate text-[1.08rem] font-semibold text-dark transition-colors group-hover:text-primary">
            {name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-sm text-dark">
            {deliveryFee != null ? (
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Truck size={14} className="text-primary" />
                <span>{`From ${formatCurrency(deliveryFee)}`}</span>
              </span>
            ) : null}
            {deliveryFee != null && delivery_time ? <Dot size={14} className="text-gray-300" /> : null}
            {delivery_time ? (
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Clock3 size={14} />
                <span>{delivery_time} min</span>
              </span>
            ) : null}
            {rating ? <Dot size={14} className="text-gray-300" /> : null}
            {rating ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-dark">
                <Star size={14} fill="currentColor" className="text-amber-400" />
                <span>{rating}</span>
              </span>
            ) : null}
          </div>
        </div>
      </BuyerCard>
    </Link>
  );
};

export default RestaurantCard;
