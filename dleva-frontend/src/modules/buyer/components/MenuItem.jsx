import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';

const MenuItem = ({ id, name, description, price, image, restaurantId, restaurantName, deliveryFee }) => {
  const { addLocalItem } = useCart();

  const handleAdd = async () => {
    try {
      await addLocalItem({
        id,
        name,
        price,
        image,
        vendorId: restaurantId,
        vendorName: restaurantName,
        deliveryFee,
        quantity: 1
      });
      // Success - item added (works for both guests and authenticated users)
    } catch (e) {
      logError(e, { context: 'MenuItem.handleAdd' });
      alert('Failed to add item to cart. Please try again.');
    }
  };

const getImageUrl = () => {
    if (!image) {
      return 'https://via.placeholder.com/160';
    }
    const imagePath = image.url || image;
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    return imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;
  };

  return (
    <div className="flex gap-4 p-4 border-b border-gray-100 bg-surface last:border-0">
      {/* Text Info */}
      <div className="flex-1">
        <h4 className="font-bold text-dark">{name}</h4>
        <p className="text-xs text-muted mt-1 line-clamp-2">{description}</p>
        <div className="mt-3 font-semibold text-dark">{formatCurrency(price)}</div>
      </div>

      {/* Image & Button */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <img src={getImageUrl()} alt={name} className="w-full h-full object-cover rounded-xl" />
        
        {/* ADD BUTTON (Icon + Text) */}
        <button 
            onClick={handleAdd} 
            className="absolute -bottom-2 -right-2 bg-white text-primary px-3 py-1.5 rounded-full shadow-md border border-gray-100 active:scale-95 transition-transform cursor-pointer hover:bg-gray-50 flex items-center gap-1.5"
        >
            <ShoppingCart size={14} strokeWidth={3} />
            <span className="text-xs font-bold uppercase tracking-wide">Add</span>
        </button>
      </div>
    </div>
  );
};

export default MenuItem;