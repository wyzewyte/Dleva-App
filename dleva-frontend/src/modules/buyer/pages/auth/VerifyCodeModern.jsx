import { useState } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../../services/axios';
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
      const response = await api.post('/buyer/verify-reset-code/', {
        phone_number: phone,
        code,
      });

      if (response.status === 200) {
        setSuccess('Code verified. You can now reset your password.');
        setTimeout(() => navigate('/reset-password', { state: { phone, code } }), 800);
      }
    } catch (err) {
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.response?.data?.detail ||
        'Invalid code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Verify Code"
      icon={<ShieldCheck size={24} />}
      showBack
      onBack={() => navigate('/forgot-password')}
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
