import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Check, X } from 'lucide-react';
import buyerCheckout from '../../../services/buyerCheckout';

const PaymentSimulator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderId = searchParams.get('order_id');
  const reference = searchParams.get('reference');
  const amount = searchParams.get('amount');
  
  const [paymentStatus, setPaymentStatus] = useState('processing'); // processing | success | failed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate payment processing delay
    const timer = setTimeout(async () => {
      try {
        // ✅ Simulate random success/failure (90% success rate)
        const isSuccess = Math.random() < 0.9;
        
        // Verify payment with backend
        await buyerCheckout.verifyPayment(orderId, reference, isSuccess ? 'success' : 'failed');
        
        setPaymentStatus(isSuccess ? 'success' : 'failed');
        setLoading(false);
      } catch (err) {
        setError(err.error || 'Payment verification failed');
        setPaymentStatus('failed');
        setLoading(false);
      }
    }, 2000); // 2 second delay to simulate processing

    return () => clearTimeout(timer);
  }, [orderId, reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
          <h1 className="text-2xl font-bold text-dark mb-2">Processing Payment</h1>
          <p className="text-muted mb-4">Amount: ₦{parseFloat(amount).toLocaleString()}</p>
          <p className="text-sm text-muted">Please wait...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Payment Successful!</h1>
          <p className="text-muted mb-2">Amount: ₦{parseFloat(amount).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mb-6">Reference: {reference}</p>
          <button 
            onClick={() => navigate(`/tracking/${orderId}`)}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover"
          >
            Track Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="text-red-600" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-dark mb-2">Payment Failed</h1>
        <p className="text-muted mb-4">{error || 'Your payment could not be processed'}</p>
        <div className="space-y-2">
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover"
          >
            Retry Payment
          </button>
          <button 
            onClick={() => navigate(`/tracking/${orderId}`)}
            className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/10"
          >
            View Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulator;