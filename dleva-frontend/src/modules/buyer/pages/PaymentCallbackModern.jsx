import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import buyerCheckout from '../../../services/buyerCheckout';
import { logError } from '../../../utils/errorHandler';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  BuyerFeedbackState,
  BuyerPrimaryButton,
} from '../components/ui/BuyerPrimitives';
import BuyerPageLoading from '../components/ui/BuyerPageLoading';

const PaymentCallbackModern = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { setCartItems } = useCart();
  const hasProcessedRef = useRef(false);

  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment...');
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      if (hasProcessedRef.current) return;
      hasProcessedRef.current = true;

      try {
        if (!user) {
          setStatus('error');
          setError('Not authenticated. Please log in again.');
          return;
        }

        let reference = searchParams.get('reference');
        if (!reference) {
          const vendorId = sessionStorage.getItem('paymentVendorId');
          reference = sessionStorage.getItem(`paymentReference_${vendorId}`);
        }

        if (!reference) {
          setStatus('waiting');
          setMessage('Waiting for payment confirmation...');
          return;
        }

        setMessage('Verifying payment...');

        const vendorId = sessionStorage.getItem('paymentVendorId');
        const checkoutDataStr = sessionStorage.getItem(`checkoutData_${vendorId}`);

        if (!checkoutDataStr) {
          setStatus('error');
          setError('Checkout data was not found. Please restart checkout.');
          return;
        }

        const checkoutData = JSON.parse(checkoutDataStr);
        setMessage('Creating your order...');
        const orderData = await buyerCheckout.completePayment(checkoutData, reference);

        setOrder(orderData);
        setStatus('success');
        setMessage('Payment successful. Your order has been created.');

        sessionStorage.removeItem(`checkoutData_${vendorId}`);
        sessionStorage.removeItem(`paymentReference_${vendorId}`);
        sessionStorage.removeItem('paymentVendorId');

        try {
          setCartItems([]);
          localStorage.removeItem('dleva_cart');
        } catch {
          // ignore cart cleanup failure
        }

        setTimeout(() => navigate(`/tracking/${orderData.id}`), 1800);
      } catch (err) {
        logError(err, { context: 'PaymentCallbackModern.processPayment' });
        setStatus('error');
        setError(err.error || err.message || 'Failed to process payment. Please contact support.');
      }
    };

    processPayment();
  }, [navigate, searchParams, setCartItems, user]);

  if (status === 'processing') {
    return <BuyerPageLoading variant="centered" />;
  }

  if (status === 'success') {
    return (
      <BuyerFeedbackState
        type="success"
        title="Payment successful"
        message={order ? `Order #${order.id} is confirmed. Redirecting you to live tracking now.` : message}
        action={<BuyerPrimaryButton onClick={() => navigate(`/tracking/${order?.id}`)}>Track Order</BuyerPrimaryButton>}
      />
    );
  }

  if (status === 'waiting') {
    return (
      <BuyerFeedbackState
        type="info"
        title="Waiting for payment confirmation"
        message={error || 'If you completed payment in Paystack, tap below to continue verification.'}
        action={<BuyerPrimaryButton onClick={() => window.location.href = '/payment/callback'}>I Completed Payment</BuyerPrimaryButton>}
      />
    );
  }

  return (
    <BuyerFeedbackState
      type="error"
      title="Payment failed"
      message={error}
      action={<BuyerPrimaryButton onClick={() => navigate('/orders?tab=cart')}>Return to Cart</BuyerPrimaryButton>}
      className="max-w-md mx-auto"
    />
  );
};

export default PaymentCallbackModern;
