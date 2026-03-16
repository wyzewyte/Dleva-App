import { Link } from 'react-router-dom';

// Get the base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const RestaurantCard = ({ id, name, image }) => {
  const imageUrl = image && !image.startsWith('http') ? `${API_BASE_URL}${image}` : image || 'https://via.placeholder.com/400x200';
  return (
    <Link 
      to="/restaurants" 
      state={{ selectedId: id }}
      className="group block bg-surface border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className="relative h-40 bg-gray-200">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-dark group-hover:text-primary transition-colors truncate">
            {name}
        </h3>
      </div>
    </Link>
  );
};

export default RestaurantCard;