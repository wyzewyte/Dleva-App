import { useNavigate, Link } from 'react-router-dom';
import { Store, MapPin, ArrowRight, ShoppingBag, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import useLocation from '../../../hooks/useLocation';
import useLocationServices from '../../../hooks/useLocationServices';
import CartItem from '../components/CartItem';
import LoginPromptModal from '../components/LoginPromptModal';
import { formatCurrency } from '../../../utils/formatters';

// ─── Empty Cart Illustration ─────────────────────────────────────────────────

const EmptyCartIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-44 h-44 mx-auto" fill="none">
    <ellipse cx="100" cy="148" rx="55" ry="8" fill="#E8F5E9" />
    <path d="M60 75 L68 130 H132 L140 75 Z" fill="#A5D6A7" />
    <path d="M60 75 L68 130 H100 V75 Z" fill="#81C784" />
    <path d="M58 72 Q100 60 142 72 L140 76 Q100 64 60 76 Z" fill="#66BB6A" />
    <path d="M82 72 Q80 52 88 48 Q96 44 100 50" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M118 72 Q120 52 112 48 Q104 44 100 50" stroke="#388E3C" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M72 85 Q76 80 82 83" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <circle cx="75" cy="65" r="2" fill="#C8E6C9" opacity="0.8" />
    <circle cx="68" cy="58" r="1.5" fill="#C8E6C9" opacity="0.6" />
    <circle cx="82" cy="60" r="1" fill="#C8E6C9" opacity="0.5" />
  </svg>
);

// ─── Vendor Cart Card ─────────────────────────────────────────────────────────

const VendorCartCard = ({ group, deliveryFeeLoading, deliveryFeeError, deliveryFees, onCheckout }) => {
  const isLoadingFee = deliveryFeeLoading[group.vendorId];
  const feeError = deliveryFeeError[group.vendorId];
  const deliveryFee = !isLoadingFee && !feeError && deliveryFees[group.vendorId] != null ? deliveryFees[group.vendorId] : 0;
  const total = group.subtotal + deliveryFee;

  return (
    <div className="overflow-hidden rounded-[18px] border border-gray-200 bg-surface shadow-[0_8px_24px_rgba(15,23,42,0.04)]">

      {/* Vendor Header */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Store size={17} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-dark">{group.vendorName}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <MapPin size={11} />
                <span className="truncate">Delivering to your location</span>
              </div>
            </div>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-muted">
            {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="divide-y divide-gray-50">
        {group.items.map(item => (
          <CartItem key={item.id} {...item} />
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-medium text-dark">{formatCurrency(group.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Delivery fee</span>
          <span className={`font-medium ${feeError ? 'text-danger' : 'text-dark'}`}>
            {isLoadingFee
              ? <span className="text-muted italic text-xs">Calculating...</span>
              : feeError
                ? 'Unavailable'
                : formatCurrency(deliveryFee)
            }
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
          <span className="text-dark">Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-4 pb-4 pt-3">
        <button
          onClick={() => onCheckout(group.vendorId)}
          className="flex h-11 w-full items-center justify-between rounded-xl bg-primary px-4 text-left text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] sm:h-12 sm:px-5"
        >
          <span>Checkout</span>
          <div className="flex items-center gap-2">
            <span className="text-white/80 font-normal">{formatCurrency(total)}</span>
            <ChevronRight size={16} />
          </div>
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { token } = useAuth();
  const { currentLocation, openLocationSetup } = useLocation();
  const { getDeliveryFeesBatch, deliveryFeeLoading, deliveryFeeError } = useLocationServices();
  const [deliveryFees, setDeliveryFees] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  // Group items by vendor
  const vendorGroups = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          items: [],
          subtotal: 0,
        };
      }
      acc[item.vendorId].items.push(item);
      acc[item.vendorId].subtotal += item.price * item.quantity;
      return acc;
    }, {});
  }, [cartItems]);

  const vendorIds = useMemo(() => Object.keys(vendorGroups).map(Number), [vendorGroups]);

  // Fetch delivery fees
  useEffect(() => {
    const fetchFees = async () => {
      if (vendorIds.length > 0 && currentLocation?.latitude && currentLocation?.longitude) {
        const fees = await getDeliveryFeesBatch(vendorIds);
        setDeliveryFees(fees);
      }
    };
    fetchFees();
  }, [vendorIds, currentLocation, getDeliveryFeesBatch]);

  const handleCheckoutClick = (vendorId) => {
    if (!token) {
      setSelectedVendorId(vendorId);
      setShowLoginPrompt(true);
      return;
    }
    navigate(`/checkout/${vendorId}`);
  };

  // ── No location ──
  if (!currentLocation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-orange-50">
          <MapPin size={28} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-dark mb-2">Location Required</h3>
        <p className="text-sm text-muted mb-6 max-w-xs">
          Set your delivery location to see available restaurants and calculate delivery fees.
        </p>
        <button
          onClick={() => openLocationSetup()}
          className="w-full max-w-xs rounded-xl bg-dark py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Set Delivery Location
        </button>
      </div>
    );
  }

  // ── Empty cart ──
  if (vendorIds.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 pt-6 pb-10 text-center sm:px-6">
        <EmptyCartIllustration />
        <p className="text-base text-muted mt-4 mb-8">Your cart is empty</p>
        <Link
          to="/restaurants"
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <ShoppingBag size={18} />
          Add items to cart
        </Link>
      </div>
    );
  }

  // ── Cart with items ──
  return (
    <div className="space-y-4 pb-6">

      {/* Multiple vendor notice */}
      {vendorIds.length > 1 && (
        <div className="flex items-start gap-3 rounded-[18px] border border-accent/20 bg-accent/10 p-3.5">
          <Store size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-dark font-medium leading-snug sm:text-sm">
            You have items from <span className="font-bold">{vendorIds.length} restaurants</span>. Each will be checked out separately.
          </p>
        </div>
      )}

      {/* Vendor groups */}
      {Object.values(vendorGroups).map(group => (
        <VendorCartCard
          key={group.vendorId}
          group={group}
          deliveryFeeLoading={deliveryFeeLoading}
          deliveryFeeError={deliveryFeeError}
          deliveryFees={deliveryFees}
          onCheckout={handleCheckoutClick}
        />
      ))}

      {/* Login prompt modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Proceed to Checkout"
        message="Please login or create an account to complete your order and track your delivery."
        redirectAfterLogin={selectedVendorId ? `/checkout/${selectedVendorId}` : null}
      />
    </div>
  );
};

export default Cart
