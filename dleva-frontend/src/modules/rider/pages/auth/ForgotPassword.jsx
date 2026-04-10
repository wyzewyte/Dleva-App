import { useState } from 'react';
import { KeyRound, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { riderPasswordReset } from '../../../../services/passwordResetService';
import {
  RiderAuthPanel,
  RiderFeedbackState,
  RiderFormField,
  RiderPrimaryButton,
  RiderTextInput,
} from '../../components/ui/RiderPrimitives';

const ForgotPassword = () => {
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
      const result = await riderPasswordReset.requestPasswordReset(phone);
      if (result.success) {
        setSuccess('A verification code has been sent to your phone.');
        setTimeout(() => {
          navigate('/rider/verify-reset-code', { state: { phone } });
        }, 1200);
      }
    } catch (err) {
      setError(err.error || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RiderAuthPanel
      title="Forgot Password"
      subtitle="Enter your phone number to reset your password"
      showBack
      onBack={() => navigate('/rider/login')}
      icon={<KeyRound size={32} className="text-primary" />}
      footer={
        <>
          Remember your password?{' '}
          <button
            onClick={() => navigate('/rider/login')}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <RiderFeedbackState
            type="error"
            title="Could not send code"
            message={error}
          />
        )}
        {success && (
          <RiderFeedbackState
            type="success"
            title="Code sent"
            message={success}
          />
        )}

        <RiderFormField label="Phone Number">
          <RiderTextInput
            icon={Phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
          />
        </RiderFormField>

        <RiderPrimaryButton type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Verification Code'}
        </RiderPrimaryButton>
      </form>
    </RiderAuthPanel>
  );
};

export default ForgotPassword;
