import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const RestaurantCard = ({ id, name, image, rating, delivery_time, is_open }) => {
  const imageUrl =
    image && !image.startsWith('http')
      ? `${API_BASE_URL}${image}`
      : image || 'https://via.placeholder.com/400x200';

  return (
    <Link
      to={`/restaurant/${id}`}
      className="group block bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-gray-100"
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Open/Closed badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          is_open !== false
            ? 'bg-primary text-white'
            : 'bg-dark/70 text-white'
        }`}>
          {is_open !== false ? 'Open' : 'Closed'}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="font-bold text-sm text-dark truncate mb-1.5 group-hover:text-primary transition-colors">
          {name}
        </h3>

        <div className="flex items-center gap-3">
          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1">
              <Star size={11} fill="#f47b00" className="text-accent" />
              <span className="text-xs font-semibold text-dark">{rating}</span>
            </div>
          )}

          {/* Delivery time */}
          {delivery_time && (
            <div className="flex items-center gap-1 text-muted">
              <Clock size={11} />
              <span className="text-xs">{delivery_time} mins</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;