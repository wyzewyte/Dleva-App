import { useState } from 'react';
import { X, Lock, Phone } from 'lucide-react';
import {
  BuyerCard,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerSecondaryButton,
  BuyerTextInput,
} from '../ui/BuyerPrimitives';
import api from '../../../../services/axios';

/**
 * ProfileUpdateOTPModal
 * Modal for verifying phone number before profile updates
 * 
 * Usage:
 * <ProfileUpdateOTPModal
 *   isOpen={showOTPModal}
 *   phone={phoneNumber}
 *   onVerified={() => handleProfileSave()}
 *   onClose={() => setShowOTPModal(false)}
 * />
 */
const ProfileUpdateOTPModal = ({
  isOpen,
  phone,
  onVerified,
  onClose,
  title = 'Verify Phone Number',
  description = 'Enter the verification code sent to your phone to confirm changes',
}) => {
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiresIn, setExpiresIn] = useState(10);

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/buyer/profile/verify-update-otp/request/', {
        phone_number: phone,
      });

      if (response.status === 200) {
        setStep('verify');
        setExpiresIn(response.data.expires_in_minutes || 10);
        setSuccess(`Verification code sent to ${phone}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to send verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/buyer/profile/verify-update-otp/verify/', {
        phone_number: phone,
        code: code,
      });

      if (response.status === 200 && response.data.verified) {
        setSuccess('✓ Phone verified successfully!');
        setTimeout(() => {
          onVerified();
          onClose();
          setStep('request');
          setCode('');
        }, 1000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <BuyerCard className="w-full max-w-md">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-dark">{title}</h2>
            <p className="mt-1 text-xs text-muted">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-dark"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <BuyerFeedbackState
              type="error"
              title="Verification failed"
              message={error}
            />
          )}
          {success && (
            <BuyerFeedbackState
              type="success"
              title="Success"
              message={success}
            />
          )}

          {step === 'request' ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <Phone size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-sm text-dark">
                  A verification code will be sent to:
                </p>
                <p className="mt-1 font-mono text-base font-bold text-dark">{phone}</p>
              </div>

              <BuyerPrimaryButton
                onClick={handleRequestOTP}
                loading={loading}
                className="w-full"
              >
                Send Verification Code
              </BuyerPrimaryButton>
            </div>
          ) : (
            <div className="space-y-4">
              <BuyerFormField label="Verification Code">
                <BuyerTextInput
                  icon={Lock}
                  placeholder="000000"
                  maxLength="6"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                />
              </BuyerFormField>

              <p className="text-xs text-muted">
                Code expires in {expiresIn} minutes
              </p>

              <div className="flex gap-3">
                <BuyerPrimaryButton
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={code.length !== 6}
                  className="flex-1"
                >
                  Verify
                </BuyerPrimaryButton>
                <BuyerSecondaryButton
                  onClick={() => {
                    setStep('request');
                    setCode('');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </BuyerSecondaryButton>
              </div>

              <button
                onClick={handleRequestOTP}
                disabled={loading}
                className="w-full rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                Didn't receive the code?
              </button>
            </div>
          )}
        </div>
      </BuyerCard>
    </div>
  );
};

export default ProfileUpdateOTPModal;
