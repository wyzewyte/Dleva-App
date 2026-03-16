import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import buyerCheckout from '../../../services/buyerCheckout';
import { logError } from '../../../utils/errorHandler';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import { useCart } from '../context/CartContext';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { setCartItems } = useCart();
  
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [message, setMessage] = useState('Processing your payment...');
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  
  // ✅ PREVENT DUPLICATE PROCESSING (React StrictMode runs effects twice in dev)
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const processPayment = async () => {
      // ✅ Idempotency check: only process once
      if (hasProcessedRef.current) {
        console.log('⚠️ Payment already being processed, skipping duplicate...');
        return;
      }
      hasProcessedRef.current = true;
      try {
        if (!user) {
          setStatus('error');
          setError('Not authenticated. Please log in again.');
          return;
        }

        // ✅ Get payment reference from URL first
        let reference = searchParams.get('reference');
        
        // ✅ If not in URL, try to get from sessionStorage (fallback for test mode)
        if (!reference) {
          console.log('📋 No reference in URL, checking sessionStorage...');
          const vendorId = sessionStorage.getItem('paymentVendorId');
          reference = sessionStorage.getItem(`paymentReference_${vendorId}`);
          console.log('📋 Reference from sessionStorage:', reference);
        }
        
        if (!reference) {
          setStatus('waiting');
          setMessage('Waiting for payment confirmation...');
          console.log('⚠️ No reference found - user needs to complete payment');
          return;
        }

        console.log('🔍 Processing payment callback:', reference);
        setMessage('Verifying payment...');

        // ✅ Get checkout data from sessionStorage
        const vendorId = sessionStorage.getItem('paymentVendorId');
        const checkoutDataStr = sessionStorage.getItem(`checkoutData_${vendorId}`);

        if (!checkoutDataStr) {
          setStatus('error');
          setError('Checkout data not found. Your session may have expired. Please start over.');
          console.log('❌ Checkout data missing from sessionStorage');
          return;
        }

        const checkoutData = JSON.parse(checkoutDataStr);
        console.log('📋 Checkout data:', checkoutData);

        // ✅ COMPLETE PAYMENT & CREATE ORDER
        setMessage('Creating order...');
        const orderData = await buyerCheckout.completePayment(checkoutData, reference);

        console.log('✅ Order created successfully:', orderData);

        setOrder(orderData);
        setStatus('success');
        setMessage('Payment successful! Order created.');

        // ✅ Clear sessionStorage
        sessionStorage.removeItem(`checkoutData_${vendorId}`);
        sessionStorage.removeItem(`paymentReference_${vendorId}`);
        sessionStorage.removeItem('paymentVendorId');
        
        // ✅ CLEAR CART - Update CartContext state (not just localStorage)
        try {
          setCartItems([]);  // ✅ Clear CartContext state so UI updates
          localStorage.removeItem('dleva_cart');  // Also clear localStorage
          console.log('✅ Cart cleared from CartContext & localStorage');
        } catch (err) {
          console.log('⚠️ Could not clear cart:', err);
        }

        // ✅ Redirect to tracking page after 2 seconds
        setTimeout(() => {
          navigate(`/tracking/${orderData.id}`);
        }, 2000);

      } catch (err) {
        console.error('❌ Payment processing error:', err);
        logError(err, { context: 'PaymentCallback.processPayment' });
        
        setStatus('error');
        setError(
          err.error || 
          err.message || 
          'Failed to process payment. Please contact support.'
        );
      }
    };

    processPayment();
}, [user, navigate, searchParams]); // ✅ Effect runs but has idempotency check to prevent duplicates

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {status === 'processing' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {message}
            </h2>
            <p className="text-gray-600">
              Please wait while we process your payment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ✅ Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            {order && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Order ID:</strong> #{order.id}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Total:</strong> ₦{order.total_price}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Redirecting to tracking page...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ❌ Payment Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}

        {status === 'waiting' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ⏳ Waiting for Payment Confirmation
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'The payment reference was not received. Did you complete the payment on Paystack?'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.href = '/payment/callback'}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                ✓ I Completed Payment
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Go Back
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
