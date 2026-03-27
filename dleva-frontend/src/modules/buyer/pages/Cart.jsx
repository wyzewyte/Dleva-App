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
import { getMessage } from '../../../constants/messages';

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
    <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Vendor Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Store size={17} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-dark truncate">{group.vendorName}</h3>
          <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
            <MapPin size={11} />
            <span>Delivering to your location</span>
          </div>
        </div>
        <span className="text-xs text-muted font-medium flex-shrink-0">
          {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Cart Items */}
      <div className="divide-y divide-gray-50">
        {group.items.map(item => (
          <CartItem key={item.id} {...item} />
        ))}
      </div>

      {/* Totals */}
      <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 space-y-2">
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
        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
          <span className="text-dark">Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-4 pb-4 pt-3">
        <button
          onClick={() => onCheckout(group.vendorId)}
          className="w-full flex items-center justify-between px-5 py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-sm"
        >
          <span>Checkout</span>
          <div className="flex items-center gap-2">
            <span className="text-white/80 font-normal">{formatCurrency(total)}</span>
            <ChevronRight size={18} />
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
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
          <MapPin size={28} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-dark mb-2">Location Required</h3>
        <p className="text-sm text-muted mb-6 max-w-xs">
          Set your delivery location to see available restaurants and calculate delivery fees.
        </p>
        <button
          onClick={() => openLocationSetup()}
          className="w-full max-w-xs py-4 bg-dark text-white font-bold rounded-2xl hover:opacity-90 transition-opacity text-sm"
        >
          Set Delivery Location
        </button>
      </div>
    );
  }

  // ── Empty cart ──
  if (vendorIds.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 pt-6 pb-10 text-center">
        <EmptyCartIllustration />
        <p className="text-base text-muted mt-4 mb-8">Your cart is empty</p>
        <Link
          to="/restaurants"
          className="w-full max-w-xs py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
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
        <div className="flex items-start gap-3 p-3.5 bg-accent/10 rounded-2xl border border-accent/20">
          <Store size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-dark font-medium leading-snug">
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