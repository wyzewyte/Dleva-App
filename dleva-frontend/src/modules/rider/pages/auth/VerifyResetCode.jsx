import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { riderPasswordReset } from '../../../../services/passwordResetService';
import {
  RiderAuthPanel,
  RiderFeedbackState,
  RiderFormField,
  RiderPrimaryButton,
  RiderTextInput,
} from '../../components/ui/RiderPrimitives';

const VerifyResetCode = () => {
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
      const result = await riderPasswordReset.verifyResetCode(phone, code);
      if (result.success) {
        setSuccess('Code verified. You can now reset your password.');
        setTimeout(() => {
          navigate('/rider/reset-password', { state: { phone, code } });
        }, 1200);
      }
    } catch (err) {
      setError(err.error || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RiderAuthPanel
      title="Verify Code"
      subtitle="Enter the 6-digit code sent to your phone"
      showBack
      onBack={() => navigate('/rider/forgot-password')}
      icon={<ShieldCheck size={32} className="text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <RiderFeedbackState
            type="error"
            title="Could not verify code"
            message={error}
          />
        )}
        {success && (
          <RiderFeedbackState
            type="success"
            title="Code verified"
            message={success}
          />
        )}

        <RiderFormField label="Verification Code">
          <RiderTextInput
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength="6"
            required
          />
        </RiderFormField>

        <RiderPrimaryButton type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Code'}
        </RiderPrimaryButton>

        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">Didn&apos;t receive the code?</p>
          <button
            type="button"
            onClick={() => navigate('/rider/forgot-password')}
            className="font-semibold text-primary hover:underline"
          >
            Request a new code
          </button>
        </div>
      </form>
    </RiderAuthPanel>
  );
};

export default VerifyResetCode;
