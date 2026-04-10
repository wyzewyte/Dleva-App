import { useState } from 'react';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../../services/axios';
import {
  BuyerAuthPanel,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerTextInput,
} from '../../components/ui/BuyerPrimitives';

const ResetPasswordModern = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  const code = location.state?.code || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/buyer/reset-password/', {
        phone_number: phone,
        code,
        password,
      });

      if (response.status === 200) {
        setSuccess('Password reset successful.');
        setTimeout(() => navigate('/login'), 1200);
      }
    } catch (err) {
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.response?.data?.detail ||
        'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Reset Password"
      icon={<KeyRound size={24} />}
      showBack
      onBack={() => navigate('/verify-code', { state: { phone } })}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <BuyerFeedbackState type="error" title="Could not reset password" message={error} /> : null}
        {success ? <BuyerFeedbackState type="success" title="Password updated" message={success} /> : null}

        <BuyerFormField label="New Password">
          <BuyerTextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" required />
        </BuyerFormField>

        <BuyerFormField label="Confirm Password">
          <BuyerTextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" required />
        </BuyerFormField>

        <BuyerPrimaryButton type="submit" loading={loading}>
          Reset Password
        </BuyerPrimaryButton>
      </form>
    </BuyerAuthPanel>
  );
};

export default ResetPasswordModern;
