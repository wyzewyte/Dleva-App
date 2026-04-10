import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { riderPasswordReset } from '../../../../services/passwordResetService';
import {
  RiderAuthPanel,
  RiderFeedbackState,
  RiderFormField,
  RiderPrimaryButton,
  RiderTextInput,
} from '../../components/ui/RiderPrimitives';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  const code = location.state?.code || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const result = await riderPasswordReset.resetPassword(phone, code, password);
      if (result.success) {
        setSuccess('Password reset successful. Redirecting to login...');
        setTimeout(() => {
          navigate('/rider/login');
        }, 1500);
      }
    } catch (err) {
      setError(err.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RiderAuthPanel
      title="Reset Password"
      subtitle="Create a new password for your account"
      showBack
      onBack={() => navigate('/rider/verify-reset-code', { state: { phone } })}
      icon={<KeyRound size={32} className="text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <RiderFeedbackState
            type="error"
            title="Could not reset password"
            message={error}
          />
        )}
        {success && (
          <RiderFeedbackState
            type="success"
            title="Password updated"
            message={success}
          />
        )}

        <RiderFormField label="New Password">
          <div className="relative">
            <RiderTextInput
              type={showPassword ? 'text' : 'password'}
              icon={KeyRound}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              required
              inputClassName="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </RiderFormField>

        <RiderFormField label="Confirm Password">
          <div className="relative">
            <RiderTextInput
              type={showConfirm ? 'text' : 'password'}
              icon={KeyRound}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your password"
              required
              inputClassName="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </RiderFormField>

        <RiderPrimaryButton type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </RiderPrimaryButton>
      </form>
    </RiderAuthPanel>
  );
};

export default ResetPassword;
