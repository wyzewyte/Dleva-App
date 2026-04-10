import { useState } from 'react';
import { KeyRound, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/axios';
import {
  BuyerAuthPanel,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerTextInput,
} from '../../components/ui/BuyerPrimitives';

const ForgotPasswordModern = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/buyer/forgot-password/', {
        phone_number: phone,
      });

      if (response.status === 200) {
        setSuccess('A verification code has been sent to your phone.');
        setTimeout(() => navigate('/verify-code', { state: { phone } }), 800);
      }
    } catch (err) {
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.response?.data?.detail ||
        'Failed to send code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Forgot Password"
      icon={<KeyRound size={24} />}
      showBack
      onBack={() => navigate('/login')}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <BuyerFeedbackState type="error" title="Could not send code" message={error} /> : null}
        {success ? <BuyerFeedbackState type="success" title="Code sent" message={success} /> : null}

        <BuyerFormField label="Phone Number">
          <BuyerTextInput
            icon={Phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
          />
        </BuyerFormField>

        <BuyerPrimaryButton type="submit" loading={loading}>
          Send Verification Code
        </BuyerPrimaryButton>
      </form>
    </BuyerAuthPanel>
  );
};

export default ForgotPasswordModern;
