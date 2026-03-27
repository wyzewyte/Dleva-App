import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2, MapPin, ChevronRight, ShieldCheck, Tag, CheckCircle, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import buyerCheckout from '../../../services/buyerCheckout';
import buyerProfile from '../../../services/buyerProfile';
import buyerRestaurants from '../../../services/buyerRestaurants';
import { formatCurrency } from '../../../utils/formatters';
import { validateAddressCoordinateSeparation, getAddressValidationErrorMessage } from '../../../utils/addressValidators';
import { getErrorMessage, logError } from '../../../utils/errorHandler';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import useLocation from '../../../hooks/useLocation';
import useLocationServices from '../../../hooks/useLocationServices';
import GpsPermissionDialog from '../components/GpsPermissionDialog';
import liveLocationService from '../../../services/liveLocationService';
import AddressSearchComponent from '../../../components/address/AddressSearchComponent';

const GLOBAL_DELIVERY_FEE = 500;

// ─── Step Indicator ──────────────────────────────────────────────────────────

const StepIndicator = ({ step }) => {
  const steps = [
    { id: 'review', label: 'Review' },
    { id: 'payment', label: 'Payment' },
  ];

  const currentIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone
                  ? 'bg-primary text-white'
                  : isActive
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-muted'
              }`}>
                {isDone ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${isActive ? 'text-dark' : 'text-muted'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px w-8 ${i < currentIndex ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Section Card ────────────────────────────────────────────────────────────

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-surface rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const Checkout = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const { user, setUser } = useAuth();
  const { currentLocation } = useLocation();
  const { getDeliveryFee, deliveryFeeLoading, deliveryFeeError } = useLocationServices();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('review');

  const [showGpsDialog, setShowGpsDialog] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [restaurant, setRestaurant] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const { cartItems, clearVendor } = useCart();
  const vendorItems = cartItems?.filter(i => String(i.vendorId) === String(vendorId)) || [];

  // Fetch restaurant + delivery fee
  useEffect(() => {
    const fetchRestaurantAndFee = async () => {
      try {
        const data = await buyerRestaurants.getRestaurant(vendorId);
        setRestaurant(data);
        if (data?.latitude && data?.longitude && currentLocation?.latitude && currentLocation?.longitude) {
          try {
            const fee = await getDeliveryFee(vendorId);
            setDeliveryFee(fee);
          } catch (err) {
            logError(err, { context: 'Checkout.getDeliveryFee', vendorId });
            setDeliveryFee(0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
      }
    };
    if (vendorId && currentLocation?.latitude && currentLocation?.longitude) {
      fetchRestaurantAndFee();
    }
  }, [vendorId, currentLocation, getDeliveryFee]);

  // Address state
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressValue, setAddressValue] = useState(currentLocation?.address || '');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deliveryLatitude, setDeliveryLatitude] = useState(currentLocation?.latitude || null);
  const [deliveryLongitude, setDeliveryLongitude] = useState(currentLocation?.longitude || null);

  useEffect(() => {
    setAddressValue(currentLocation?.address || '');
    setDeliveryLatitude(currentLocation?.latitude || null);
    setDeliveryLongitude(currentLocation?.longitude || null);
  }, [currentLocation]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setAddressValue(address.display_name);
    setDeliveryLatitude(parseFloat(address.latitude));
    setDeliveryLongitude(parseFloat(address.longitude));
    setIsEditingAddress(false);
  };

  const saveAddress = async () => {
    try {
      setSavingAddress(true);
      setError(null);
      try {
        validateAddressCoordinateSeparation(addressValue, deliveryLatitude, deliveryLongitude);
      } catch (validationError) {
        setError(getAddressValidationErrorMessage(validationError));
        setSavingAddress(false);
        return;
      }
      const payload = { address: addressValue, latitude: deliveryLatitude, longitude: deliveryLongitude };
      const updated = await buyerProfile.updateProfile(payload);
      if (setUser) setUser(updated);
      setIsEditingAddress(false);
    } catch (err) {
      setError(err.error || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  // Order summary persistence
  const [orderSummary, setOrderSummary] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`orderSummary_${vendorId}`);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (orderSummary) {
      sessionStorage.setItem(`orderSummary_${vendorId}`, JSON.stringify(orderSummary));
    }
  }, [orderSummary, vendorId]);

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      setLoading(true);
      setError(null);
      const checkoutData = await buyerCheckout.validateCheckout(
        vendorId, 'card', deliveryFee, addressValue, vendorItems, deliveryLatitude, deliveryLongitude
      );
      const summary = {
        items: vendorItems.map(item => ({ ...item })),
        subtotal: checkoutData.subtotal,
        total: checkoutData.total,
      };
      sessionStorage.setItem(`checkoutData_${vendorId}`, JSON.stringify(checkoutData));
      setOrderSummary(summary);
      setStep('payment');
    } catch (err) {
      logError(err, { context: 'Checkout.handlePlaceOrder' });
      setError(err.error || 'Failed to validate order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      const checkoutDataStr = sessionStorage.getItem(`checkoutData_${vendorId}`);
      if (!checkoutDataStr) {
        setError('Checkout data not found. Please review order again.');
        setLoading(false);
        return;
      }
      const checkoutData = JSON.parse(checkoutDataStr);
      const paymentData = await buyerCheckout.initializePayment(checkoutData.total);
      if (!paymentData.authorization_url) {
        setError('Failed to initialize payment. Please try again.');
        setLoading(false);
        return;
      }
      sessionStorage.setItem(`checkoutData_${vendorId}`, JSON.stringify(checkoutData));
      sessionStorage.setItem(`paymentReference_${vendorId}`, paymentData.reference);
      sessionStorage.setItem('paymentVendorId', vendorId);

      const paystackWindow = window.open(paymentData.authorization_url, 'Paystack', 'width=500,height=600');
      if (!paystackWindow) {
        window.location.href = paymentData.authorization_url;
      } else {
        setError(null);
        setStep('waiting-payment');
        const checkWindowClosed = setInterval(() => {
          try {
            if (paystackWindow.closed) {
              clearInterval(checkWindowClosed);
              setTimeout(() => {
                window.location.href = `/payment/callback?reference=${paymentData.reference}`;
              }, 500);
            }
          } catch (err) {
            console.log('Could not check popup status:', err);
          }
        }, 500);
      }
    } catch (err) {
      setError(err.error || 'Payment failed');
      setLoading(false);
    }
  };

  const handleGpsAllow = async () => {
    try {
      setGpsEnabled(true);
      await liveLocationService.startTracking(order.id, 'assigned');
      navigate(`/tracking/${order.id}`);
    } catch (err) {
      logError(err, { context: 'Checkout.handleGpsAllow' });
      navigate(`/tracking/${order.id}`);
    }
  };

  const handleGpsDeny = () => setGpsEnabled(false);
  const handleGpsDismiss = () => setShowGpsDialog(false);

  const displayItems = orderSummary?.items || vendorItems;
  const displaySubtotal = orderSummary?.subtotal ?? vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const displayTotal = orderSummary?.total ?? displaySubtotal + deliveryFee;

  // ── GPS Dialog ──
  if (showGpsDialog && order) {
    return (
      <div className="min-h-screen bg-surface">
        <GpsPermissionDialog
          isOpen={showGpsDialog}
          orderId={order.id}
          orderStatus="assigned"
          onAllow={handleGpsAllow}
          onDeny={handleGpsDeny}
          onConfirm={handleGpsDismiss}
          onDismiss={handleGpsDismiss}
        />
      </div>
    );
  }

  // ── Order Confirmed ──
  if (step === 'confirmed' && order) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <div className="bg-surface rounded-3xl p-8 text-center max-w-sm w-full border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-1">Order Confirmed!</h1>
          <p className="text-sm text-muted mb-1">Order #{order.id}</p>
          <p className="text-sm text-muted mb-8 max-w-xs mx-auto">
            Your order has been placed. Track it to know when it arrives.
          </p>
          <button
            onClick={() => navigate(`/tracking/${order.id}`)}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-colors"
          >
            Track Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <h1 className="text-xl font-bold text-dark">Checkout</h1>
        </div>

        {/* ── Step Indicator ── */}
        {(step === 'review' || step === 'payment') && <StepIndicator step={step} />}

        {/* ── Error ── */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* ── Delivery Address ── */}
        <SectionCard className="mb-4">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-0.5">
                  Deliver to
                </p>
                {!isEditingAddress ? (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-dark leading-snug">
                      {addressValue || 'No address set'}
                    </p>
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="text-xs font-bold text-primary flex-shrink-0 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <AddressSearchComponent
                      onSelect={handleAddressSelect}
                      placeholder="Search delivery address"
                      initialValue={addressValue}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveAddress}
                        disabled={savingAddress}
                        className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingAddress ? <Loader2 className="animate-spin" size={14} /> : 'Save Address'}
                      </button>
                      <button
                        onClick={() => { setIsEditingAddress(false); setAddressValue(currentLocation?.address || ''); }}
                        className="px-4 py-2.5 border-2 border-gray-200 text-dark rounded-xl text-sm font-bold hover:border-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Order Items ── */}
        <SectionCard className="mb-4">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-dark mb-3">
              {restaurant?.name || 'Your Order'}
            </h3>
            <div className="space-y-3">
              {displayItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-muted flex-shrink-0">
                      {item.quantity}
                    </span>
                    <span className="text-sm text-dark truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-dark flex-shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-4 py-3 border-t border-gray-50 mt-2 space-y-2">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span className="font-medium text-dark">{formatCurrency(displaySubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Delivery fee</span>
              <span className="font-medium text-dark">
                {deliveryFeeLoading?.[vendorId]
                  ? 'Calculating...'
                  : formatCurrency(deliveryFee)
                }
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
              <span className="text-dark">Total</span>
              <span className="text-primary">{formatCurrency(displayTotal)}</span>
            </div>
          </div>
        </SectionCard>

        {/* ── Promo Code ── */}
        <SectionCard className="mb-4">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tag size={16} className="text-accent" />
              </div>
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                className="flex-1 bg-transparent text-sm text-dark placeholder-muted focus:outline-none"
              />
              {promoCode && (
                <button className="text-xs font-bold text-primary hover:underline flex-shrink-0">
                  Apply
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Payment Info (step = payment) ── */}
        {step === 'payment' && (
          <SectionCard className="mb-4">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-dark">Secure Payment</p>
                  <p className="text-xs text-muted">Powered by Paystack</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['💳 Card', '🏦 Bank Transfer', '📱 USSD'].map(method => (
                  <span key={method} className="text-xs bg-gray-100 text-muted px-3 py-1.5 rounded-full font-medium">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── Waiting for Payment ── */}
        {step === 'waiting-payment' && (
          <SectionCard className="mb-4">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="animate-spin text-primary flex-shrink-0" size={22} />
                <p className="font-bold text-dark">Payment in Progress</p>
              </div>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                A Paystack payment window has opened. Complete your payment there and return here.
              </p>
              <ol className="space-y-2 mb-5">
                {[
                  'Complete payment on the Paystack page',
                  'Close the payment window when done',
                  'You\'ll be redirected automatically',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <button
                onClick={() => window.location.href = `/payment/callback?reference=${sessionStorage.getItem(`paymentReference_${vendorId}`)}`}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                I've Completed Payment
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── CTA Buttons ── */}
        {step === 'review' && (
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !addressValue}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading
              ? <><Loader2 className="animate-spin" size={18} /> Processing...</>
              : <>Review & Proceed <ChevronRight size={18} /></>
            }
          </button>
        )}

        {step === 'payment' && (
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading
              ? <><Loader2 className="animate-spin" size={18} /> Initializing...</>
              : <><CreditCard size={18} /> Pay {formatCurrency(displayTotal)}</>
            }
          </button>
        )}

        {/* ── Security note ── */}
        {(step === 'review' || step === 'payment') && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <ShieldCheck size={14} className="text-muted" />
            <p className="text-xs text-muted">Payments are encrypted and secure</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Checkout;