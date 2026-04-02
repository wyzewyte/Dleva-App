import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { shouldShowCartSummaryBar } from '../utils/cartSummaryBarVisibility';
import { formatCurrency } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';

const CartSummaryBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, lastAddedAt } = useCart();

  const showBar = shouldShowCartSummaryBar(location.pathname, cartItems, lastAddedAt);

  const { totalItems, subtotal } = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;

        acc.totalItems += quantity;
        acc.subtotal += price * quantity;
        return acc;
      },
      { totalItems: 0, subtotal: 0 }
    );
  }, [cartItems]);

  if (!showBar) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-6 z-40 px-4 pointer-events-none">
      <div className="mx-auto max-w-3xl pointer-events-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3 rounded-[16px] border border-gray-200 bg-surface px-3.5 py-2.5 text-dark shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:px-4 sm:py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
            <ShoppingBag size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Cart
            </p>
            <p className="truncate text-sm font-bold">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
            <p className="text-[11px] text-muted sm:text-xs">
              {formatCurrency(subtotal)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/orders?tab=cart')}
            className={cn(
              'inline-flex h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] sm:h-11 sm:px-4'
            )}
          >
            <span>View Cart</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSummaryBar;
