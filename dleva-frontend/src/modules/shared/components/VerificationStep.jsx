import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import {
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerTextInput,
} from '../../buyer/components/ui/BuyerPrimitives';

/**
 * Reusable Verification Step Component
 * Used for phone and email verification during signup
 * Can be used by both buyer and seller
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.type - 'phone' or 'email'
 * @param {string} props.value - Phone number or email to verify
 * @param {string} props.label - Label for the input (e.g., "Enter Verification Code")
 * @param {boolean} props.isLoading - Whether the request is in progress
 * @param {string} props.error - Error message to display
 * @param {Function} props.onVerify - Callback when OTP is submitted (receives otpCode)
 * @param {Function} props.onBack - Callback when back button is clicked
 * @param {boolean} props.showDebugOtp - Whether to show debug OTP (development)
 * @param {string} props.debugOtp - Debug OTP code to display
 * 
 * @example
 * <VerificationStep
 *   type="phone"
 *   value={phoneNumber}
 *   isLoading={isLoading}
 *   error={error}
 *   onVerify={handleVerify}
 *   onBack={handleBack}
 *   showDebugOtp={true}
 *   debugOtp="123456"
 * />
 */
const VerificationStep = ({
  type = 'phone', // 'phone' or 'email'
  value = '',
  label = 'Enter Verification Code',
  isLoading = false,
  error = '',
  onVerify = () => {},
  onBack = () => {},
  showDebugOtp = false,
  debugOtp = '',
}) => {
  const [otpCode, setOtpCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otpCode.trim()) {
      onVerify(otpCode);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <BuyerFeedbackState type="error" title="Verification failed" message={error} />
      ) : null}

      {/* Display where OTP was sent */}
      <div className="rounded-lg bg-accent-light p-4 text-sm text-accent">
        <p className="font-semibold mb-2">Verification Code Sent</p>
        <p>We've sent a verification code to:</p>
        <div className="flex items-center gap-2 mt-1 font-semibold">
          {type === 'phone' ? <Phone size={16} /> : <Mail size={16} />}
          <span>{value}</span>
        </div>
      </div>

      {/* OTP Input Field */}
      <BuyerFormField label={label}>
        <BuyerTextInput
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          placeholder="000000"
          maxLength="6"
          required
        />
      </BuyerFormField>

      {/* Debug OTP Display (Development Only) */}
      {showDebugOtp && debugOtp && (
        <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800 border border-yellow-200">
          <p className="font-semibold">Development: {debugOtp}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          disabled={isLoading}
        >
          Back
        </button>
        <BuyerPrimaryButton
          type="submit"
          loading={isLoading}
          className="flex-1"
          disabled={!otpCode.trim() || isLoading}
        >
          Verify Code
        </BuyerPrimaryButton>
      </div>
    </form>
  );
};

export default VerificationStep;
