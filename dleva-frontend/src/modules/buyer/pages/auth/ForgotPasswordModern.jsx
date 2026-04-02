import { useState } from 'react';
import { KeyRound, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
      const response = await fetch('/api/buyer/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('A verification code has been sent to your phone.');
        setTimeout(() => navigate('/verify-code', { state: { phone } }), 800);
      } else {
        setError(data.detail || 'Failed to send code.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Forgot Password"
      icon={<KeyRound size={24} />}
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
