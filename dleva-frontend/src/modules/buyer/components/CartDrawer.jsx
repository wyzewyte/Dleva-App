import { X, ShoppingBag, ArrowRight, Store, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/formatters';
import { logError } from '../../../utils/errorHandler';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  // --- 1. GROUPING LOGIC (With Delivery Fee) ---
  const groupedItems = cartItems.reduce((acc, item) => {
    if (!acc[item.vendorId]) {
      acc[item.vendorId] = { 
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          // READ THE FEE HERE (Default to 0 if missing) - use deliveryFee from item
          deliveryFee: item.deliveryFee || 0, 
          items: [], 
          subtotal: 0 
      };
    }
    acc[item.vendorId].items.push(item);
    acc[item.vendorId].subtotal += item.price * item.quantity;
    return acc;
  }, {});

  const vendorGroups = Object.values(groupedItems);

  // --- 2. CHECKOUT HANDLER ---
  const handleCheckout = (vendorId) => {
      setIsCartOpen(false);
      navigate(`/checkout/${vendorId}`); // Go to specific URL
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2 font-bold text-lg">
                <ShoppingBag className="text-primary" />
                My Cart ({cartItems.length})
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
            {vendorGroups.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted space-y-4">
                    <p>Your cart is empty.</p>
                    <button onClick={() => setIsCartOpen(false)} className="text-primary font-bold">Start Shopping</button>
                </div>
            ) : (
                vendorGroups.map((group) => (
                    <div key={group.vendorId} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                        
                        {/* Vendor Name Header */}
                        <div className="bg-gray-50 p-3 border-b border-gray-100 flex items-center gap-2 text-primary font-bold">
                            <Store size={16} /> {group.vendorName}
                        </div>

                        {/* Items List */}
                        <div className="divide-y divide-gray-50">
                            {group.items.map((item) => (
                                <div key={`${item.id}-${item.vendorId}`} className="p-3 flex gap-3">
                                    <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-gray-200" alt="" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-sm text-dark line-clamp-1">{item.name}</h4>
                                            <button 
                                                onClick={() => removeFromCart(item.id, item.vendorId)}  // ✅ Pass vendorId
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                                            
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.vendorId, 'minus')}  // ✅ Pass vendorId
                                                    className="p-1 hover:bg-white rounded shadow-sm"
                                                >
                                                    <Minus size={14}/>
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.vendorId, 'plus')}  // ✅ Pass vendorId
                                                    className="p-1 hover:bg-white rounded shadow-sm"
                                                >
                                                    <Plus size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- TOTALS SECTION --- */}
                        <div className="p-3 bg-gray-50 space-y-2 border-t border-gray-100">
                            
                            {/* Subtotal */}
                            <div className="flex justify-between text-xs text-muted">
                                <span>Subtotal</span>
                                <span>{formatCurrency(group.subtotal)}</span>
                            </div>

                            {/* Delivery Fee */}
                            <div className="flex justify-between text-xs text-muted">
                                <span>Delivery Fee</span>
                                <span>{formatCurrency(group.deliveryFee)}</span>
                            </div>

                            {/* FINAL TOTAL */}
                            <div className="flex justify-between font-bold text-dark text-sm pt-2 border-t border-dashed border-gray-200 mt-1 mb-3">
                                <span>Total</span>
                                <span>{formatCurrency(group.subtotal + group.deliveryFee)}</span>
                            </div>

                            <button 
                                onClick={() => handleCheckout(group.vendorId)}
                                className="w-full bg-primary text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all"
                            >
                                Checkout
                                <ArrowRight size={16} />
                            </button>
                        </div>

                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  );
};

export default CartDrawer;