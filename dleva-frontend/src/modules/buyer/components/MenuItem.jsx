import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';
import { BuyerSecondaryButton } from './ui/BuyerPrimitives';

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
      return null;
    }
    const imagePath = image.url || image;
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    return imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="flex gap-4 border-b border-gray-100 bg-surface px-4 py-4 last:border-0">
      <div className="flex-1">
        <h4 className="font-semibold text-dark">{name}</h4>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>
        <div className="mt-3 font-semibold text-dark">{formatCurrency(price)}</div>
      </div>

      <div className="relative h-24 w-24 flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full rounded-[16px] object-cover" />
        ) : (
          <div className="h-full w-full rounded-[16px] bg-gray-100" />
        )}
        
        <div className="absolute -bottom-3 right-0">
          <BuyerSecondaryButton
            onClick={handleAdd}
            className="min-h-[36px] w-auto rounded-lg border-gray-200 bg-white px-3 py-1.5 text-primary shadow-sm"
            icon={<ShoppingCart size={14} strokeWidth={3} />}
          >
            Add +
          </BuyerSecondaryButton>
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
