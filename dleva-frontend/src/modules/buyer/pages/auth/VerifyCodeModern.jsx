import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BuyerAuthPanel,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerTextInput,
} from '../../components/ui/BuyerPrimitives';

const VerifyCodeModern = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/buyer/verify-reset-code/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Code verified. You can now reset your password.');
        setTimeout(() => navigate('/reset-password', { state: { phone, code } }), 800);
      } else {
        setError(data.detail || 'Invalid code.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Verify Code"
      icon={<ShieldCheck size={24} />}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <BuyerFeedbackState type="error" title="Could not verify code" message={error} /> : null}
        {success ? <BuyerFeedbackState type="success" title="Code verified" message={success} /> : null}

        <BuyerFormField label="Verification Code">
          <BuyerTextInput
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter the code sent to your phone"
            required
          />
        </BuyerFormField>

        <BuyerPrimaryButton type="submit" loading={loading}>
          Verify Code
        </BuyerPrimaryButton>
      </form>
    </BuyerAuthPanel>
  );
};

export default VerifyCodeModern;
