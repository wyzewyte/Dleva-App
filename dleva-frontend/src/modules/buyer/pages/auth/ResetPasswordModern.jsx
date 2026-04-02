import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      const response = await fetch('/api/buyer/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, password }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successful.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setError(data.detail || 'Failed to reset password.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Reset Password"
      icon={<KeyRound size={24} />}
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
