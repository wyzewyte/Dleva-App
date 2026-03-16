import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2, MapPin, Phone, Clock } from 'lucide-react';
import buyerCheckout from '../../../services/buyerCheckout';
import buyerProfile from '../../../services/buyerProfile';
import buyerCart from '../../../services/buyerCart';
import buyerRestaurants from '../../../services/buyerRestaurants';
import { estimateDeliveryFee } from '../../../services/deliveryService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { validateEmail, validateAddress } from '../../../utils/validators';
import { validateAddressCoordinateSeparation, getAddressValidationErrorMessage } from '../../../utils/addressValidators';
import { getMessage } from '../../../constants/messages';
import { getErrorMessage, logError } from '../../../utils/errorHandler';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import useLocation from '../../../hooks/useLocation'; // Phase 3
import GpsPermissionDialog from '../components/GpsPermissionDialog'; // Phase 5
import liveLocationService from '../../../services/liveLocationService'; // Phase 5
import AddressSearchComponent from '../../../components/address/AddressSearchComponent'; // Phase 6
import { useAddressForm } from '../../../hooks/useAddressSearch'; // Phase 6

const Checkout = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const { user, setUser } = useAuth();
  const { currentLocation } = useLocation(); // Phase 3
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('review'); // review -> payment -> confirmed

  // Phase 5: GPS tracking
  const [showGpsDialog, setShowGpsDialog] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  // ✅ PAYSTACK ONLY - No cash on delivery
  const [promoCode, setPromoCode] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0); // Will be fetched from API
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const { cartItems, clearVendor } = useCart();
  const vendorItems = cartItems?.filter(i => String(i.vendorId) === String(vendorId)) || [];

  // Fetch restaurant details and calculate delivery fee via API
  useEffect(() => {
    const fetchRestaurantAndFee = async () => {
      try {
        const data = await buyerRestaurants.getRestaurant(vendorId);
        setRestaurant(data);
        
        // Phase 3: Use location from context instead of user profile
        if (data?.latitude && data?.longitude && currentLocation?.latitude && currentLocation?.longitude) {
          setLoadingDeliveryFee(true);
          const result = await estimateDeliveryFee(vendorId, currentLocation.latitude, currentLocation.longitude);
          
          if (result.success) {
            setDeliveryFee(result.deliveryFee);
          } else {
            logError(new Error(result.error), { context: 'Checkout.fetchRestaurantAndFee', vendorId });
            setDeliveryFee(0); // Set to 0 if calculation fails
          }
          setLoadingDeliveryFee(false);
        }
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
        setLoadingDeliveryFee(false);
      }
    };

    if (vendorId && currentLocation?.latitude && currentLocation?.longitude) {
      fetchRestaurantAndFee();
    }
  }, [vendorId, currentLocation]);

  // Address handling - Phase 6: Integrated with AddressSearchComponent
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

  // Handle address selection from AddressSearchComponent
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
      
      // Validate address/coordinate separation
      try {
        validateAddressCoordinateSeparation(addressValue, deliveryLatitude, deliveryLongitude);
      } catch (validationError) {
        setError(getAddressValidationErrorMessage(validationError));
        setSavingAddress(false);
        return;
      }
      
      const payload = {
        address: addressValue,
        latitude: deliveryLatitude,
        longitude: deliveryLongitude,
      };
      const updated = await buyerProfile.updateProfile(payload);
      // update auth context so profile stays in sync across app
      if (setUser) setUser(updated);
      setIsEditingAddress(false);
    } catch (err) {
      setError(err.error || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  // ✅ PERSIST SUMMARY TO SESSIONSTORAGE
  const [orderSummary, setOrderSummary] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`orderSummary_${vendorId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Update sessionStorage whenever orderSummary changes
  useEffect(() => {
    if (orderSummary) {
      sessionStorage.setItem(`orderSummary_${vendorId}`, JSON.stringify(orderSummary));
    }
  }, [orderSummary, vendorId]);

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ SECURE FLOW: Validate checkout ONLY (don't create order yet)
      const checkoutData = await buyerCheckout.validateCheckout(
        vendorId,
        'card',  // ✅ PAYSTACK ONLY
        deliveryFee,
        addressValue,
        vendorItems,
        deliveryLatitude,
        deliveryLongitude
      );

      console.log('✅ Checkout validated:', checkoutData);

      // ✅ Store checkout data to sessionStorage (will be used after payment)
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
      
      // ✅ SECURE FLOW: Get checkout data from sessionStorage
      const checkoutDataStr = sessionStorage.getItem(`checkoutData_${vendorId}`);
      if (!checkoutDataStr) {
        setError('Checkout data not found. Please review order again.');
        setLoading(false);
        return;
      }
      
      const checkoutData = JSON.parse(checkoutDataStr);
      
      // ✅ Initialize payment WITHOUT creating order
      const paymentData = await buyerCheckout.initializePayment(checkoutData.total);
      
      if (!paymentData.authorization_url) {
        setError('Failed to initialize payment. Please try again.');
        setLoading(false);
        return;
      }
      
      // ✅ Save checkout and payment data for callback
      sessionStorage.setItem(`checkoutData_${vendorId}`, JSON.stringify(checkoutData));
      sessionStorage.setItem(`paymentReference_${vendorId}`, paymentData.reference);
      
      console.log('🔗 Redirecting to Paystack:', paymentData.authorization_url);
      // Store the current vendorId for the callback to use
      sessionStorage.setItem('paymentVendorId', vendorId);
      
      // ✅ IMPORTANT: Some payment gateways need callback URL with reference
      // Format: http://localhost:5173/payment/callback?reference=<ref>
      // After payment, Paystack will either:
      // 1. Automatically redirect to callback URL (in production)
      // 2. Show success page where user clicks "Continue" (in test mode)
      // 3. We can manually redirect with the reference
      
      // ✅ Try to open Paystack in popup, with fallback to full redirect
      const paystackWindow = window.open(paymentData.authorization_url, 'Paystack', 'width=500,height=600');
      
      // Check if window was opened successfully
      if (!paystackWindow) {
        // Fallback: directly redirect if popup blocked
        window.location.href = paymentData.authorization_url;
      } else {
        // ✅ Show message to user about popup
        setError(null);
        setStep('waiting-payment');  // ✅ NEW: Show waiting screen
        
        // ✅ Monitor Paystack window for closure
        const checkWindowClosed = setInterval(() => {
          try {
            // ✅ Try to close the popup (may not work due to cross-origin)
            if (paystackWindow.closed) {
              clearInterval(checkWindowClosed);
              // ✅ Redirect to callback with payment reference
              console.log('🔗 Popup closed, redirecting to callback...');
              setTimeout(() => {
                window.location.href = `/payment/callback?reference=${paymentData.reference}`;
              }, 500);
            }
          } catch (err) {
            console.log('⚠️ Could not check popup status:', err);
          }
        }, 500);
      }
      
    } catch (err) {
      setError(err.error || 'Payment failed');
      console.error('Payment error:', err);
      setLoading(false);
    }
  };

  // Phase 5: Handle GPS permission dialog
  const handleGpsAllow = async () => {
    try {
      setGpsEnabled(true);
      // Start tracking buyer location for this order
      await liveLocationService.startTracking(order.id, 'assigned');
      console.log('✅ Location tracking enabled for order', order.id);
      // Redirect to tracking page
      navigate(`/tracking/${order.id}`);
    } catch (err) {
      console.error('Error starting location tracking:', err);
      logError(err, { context: 'Checkout.handleGpsAllow' });
      navigate(`/tracking/${order.id}`);
    }
  };

  const handleGpsDeny = () => {
    setGpsEnabled(false);
    console.log('❌ Location tracking denied by user');
  };

  const handleGpsDismiss = () => {
    setShowGpsDialog(false);
  };

  // Use stored summary if available, otherwise calculate from current items
  const displayItems = orderSummary?.items || vendorItems;
  const displaySubtotal = orderSummary?.subtotal ?? (vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0);
  const displayTotal = orderSummary?.total ?? (displaySubtotal + deliveryFee);

  // Phase 5: GPS Dialog Component - REMOVED (no cash on delivery)
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

  if (step === 'confirmed' && order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Order Confirmed!</h1>
          <p className="text-muted mb-4">Order #{order.id}</p>
          <p className="text-sm text-muted mb-6">
            Your order has been placed successfully. Track your order to know when it arrives.
          </p>
          <button 
            onClick={() => navigate(`/tracking/${order.id}`)}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover"
          >
            Track Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-dark mb-6">Checkout</h1>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="text-primary mt-1" size={20} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted uppercase font-bold">Deliver to</p>
                  {!isEditingAddress ? (
                    <>
                      <p className="font-bold text-dark">{addressValue || 'No address set'}</p>
                      {selectedAddress && (
                        <p className="text-xs text-gray-600 mt-1">
                          Coordinates: {selectedAddress.latitude?.toFixed(6)}, {selectedAddress.longitude?.toFixed(6)}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mt-2">
                      <AddressSearchComponent
                        onSelect={handleAddressSelect}
                        placeholder="Search and select delivery address"
                        initialValue={addressValue}
                      />
                    </div>
                  )}
                </div>

                {!isEditingAddress ? (
                  <button onClick={() => setIsEditingAddress(true)} className="text-primary text-sm font-bold">
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveAddress}
                      disabled={savingAddress}
                      className="text-white bg-primary px-3 py-2 rounded-lg text-sm font-bold"
                    >
                      {savingAddress ? <Loader2 className="animate-spin" size={16} /> : 'Save'}
                    </button>
                    <button
                      onClick={() => { setIsEditingAddress(false); setAddressValue(currentLocation?.address || ''); }}
                      className="text-sm px-3 py-2 rounded-lg border border-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - USE DISPLAY VALUES */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <h3 className="font-bold text-dark mb-3">Order Summary</h3>
          <div className="space-y-2 mb-3">
            {displayItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(displaySubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>
                {loadingDeliveryFee 
                  ? getMessage('INFO.CALCULATING') 
                  : formatCurrency(deliveryFee)
                }
              </span>
            </div>
            {promoCode && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promo Discount</span>
                <span>-₦500</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Total</span>
              <span>{formatCurrency(displayTotal)}</span>
            </div>
          </div>
        </div>

        {/* Promo Code */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <input 
            type="text" 
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Payment Info - Paystack Only */}
        {step === 'payment' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-dark mb-2">💳 Secure Payment</h3>
            <p className="text-sm text-gray-700">
              You will be redirected to Paystack to complete your payment securely. 
              All transactions are encrypted and protected.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              ✅ Debit/Credit Card • 🏦 Bank Transfer • 📱 USSD
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {step === 'review' && (
          <button 
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Place Order'}
          </button>
        )}

        {step === 'payment' && (
          <button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : `Pay ${formatCurrency(displayTotal)} with Paystack`}
          </button>
        )}

        {step === 'waiting-payment' && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="animate-spin text-blue-600" size={24} />
              <h3 className="font-bold text-blue-900">Payment in Progress</h3>
            </div>
            <p className="text-blue-800 mb-4">
              ✅ A Paystack payment window has opened. Please complete your payment there.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
              <p className="text-sm text-gray-700 mb-2"><strong>Next steps:</strong></p>
              <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                <li>Complete your payment on the Paystack page</li>
                <li>Close the payment window when done</li>
                <li>You'll be redirected automatically</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.href = `/payment/callback?reference=${sessionStorage.getItem(`paymentReference_${vendorId}`)}`}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              ✓ I've Completed Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;