import { Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../../../utils/formatters';

const CartItem = ({ id, vendorId, name, price, quantity, image }) => {
  // ✅ FIXED: Accept vendorId
  const { removeFromCart, updateQuantity } = useCart();

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Small Image */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-semibold text-dark line-clamp-1">{name}</h4>

          <button
            onClick={() => removeFromCart(id, vendorId)}  // ✅ Pass vendorId
            className="flex items-center gap-1 text-xs font-medium text-muted hover:text-danger transition-colors p-1"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>

        <div className="flex justify-between items-center mt-1">
          <span className="text-sm font-bold text-primary">{formatCurrency(price)}</span>

          <div className="flex items-center gap-3 bg-gray-50 rounded-md px-2 py-1 border border-gray-200">
            <button
              onClick={() => updateQuantity(id, vendorId, 'minus')}  // ✅ Pass vendorId
              className="text-dark hover:text-primary active:scale-90 transition-transform"
              disabled={quantity <= 1}
            >
              <Minus size={12} />
            </button>

            <span className="text-xs font-semibold w-3 text-center select-none">
              {quantity}
            </span>

            <button
              onClick={() => updateQuantity(id, vendorId, 'plus')}  // ✅ Pass vendorId
              className="text-dark hover:text-primary active:scale-90 transition-transform"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;