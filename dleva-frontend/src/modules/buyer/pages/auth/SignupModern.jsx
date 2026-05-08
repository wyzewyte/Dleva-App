import { useState } from 'react';
import { Eye, EyeOff, Mail, User, Phone } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import buyerAuthService from '../../services/buyerAuthService';
import VerificationStep from '../../../shared/components/VerificationStep';
import { useAuth } from '../../../auth/context/AuthContext';
import toast from '../../../../services/toast';
import brandLogo from '../../../../assets/images/logo.svg';
import {
  BuyerAuthPanel,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerTextInput,
} from '../../components/ui/BuyerPrimitives';

const SignupModern = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // Steps: 1=Form, 2=PhoneVerification, 3=EmailVerification.
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    username: '',
    password: '',
  });

  const redirectUrl = searchParams.get('next');

  const getErrorMessage = (err, fallback) => (
    err.response?.data?.error || err.response?.data?.detail || err.message || fallback
  );

  const trimmedFormData = () => ({
    name: formData.name.trim(),
    email: formData.email.trim(),
    phone_number: formData.phone_number.trim(),
    username: formData.username.trim(),
    password: formData.password,
  });

  const pauseForToast = () => new Promise((resolve) => {
    window.setTimeout(resolve, 700);
  });

  const handleRequestPhoneOTP = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = trimmedFormData();
      await buyerAuthService.requestPhoneOTP(payload.phone_number);
      setCurrentStep(2);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send phone verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (otpCode) => {
    setIsLoading(true);
    setError('');

    try {
      const payload = trimmedFormData();
      await buyerAuthService.verifyPhoneOTP(payload.phone_number, otpCode.trim());
      toast.success('Phone number verified.');
      await pauseForToast();
      setCurrentStep(3);
      await buyerAuthService.requestEmailOTP(payload.email);
      toast.success('Email verification code sent.');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid phone verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (otpCode) => {
    setIsLoading(true);
    setError('');

    try {
      const payload = trimmedFormData();
      await buyerAuthService.verifyEmailOTP(payload.email, otpCode.trim());
      toast.success('Email verified.');
      await pauseForToast();
      await buyerAuthService.register(payload);
      await login(payload.username, payload.password);
      toast.success('Account created. Set your delivery location.');
      await pauseForToast();
      window.location.replace(redirectUrl || '/setup-location');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      setIsLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title={
        currentStep === 1
          ? 'Create Account'
          : currentStep === 2
            ? 'Verify Phone Number'
            : 'Verify Email Address'
      }
      icon={<img src={brandLogo} alt="Dleva" className="h-14 w-14 sm:h-16 sm:w-16" />}
      showBack={currentStep === 1}
      onBack={() => navigate('/home')}
      footer={
        currentStep === 1 && (
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </>
        )
      }
    >
      {currentStep === 1 && (
        <form className="space-y-4" onSubmit={handleRequestPhoneOTP}>
          {error ? <BuyerFeedbackState type="error" title="Could not proceed" message={error} /> : null}

          <BuyerFormField label="Full Name">
            <BuyerTextInput
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Chika Okonkwo"
              required
            />
          </BuyerFormField>

          <BuyerFormField label="Email">
            <BuyerTextInput
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="chika@example.com"
              required
            />
          </BuyerFormField>

          <BuyerFormField label="Phone Number">
            <BuyerTextInput
              icon={Phone}
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+234 801 234 5678"
              required
            />
          </BuyerFormField>

          <BuyerFormField label="Username">
            <BuyerTextInput
              icon={User}
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="chika123"
              required
            />
          </BuyerFormField>

          <BuyerFormField label="Password">
            <div className="relative">
              <BuyerTextInput
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="........"
                inputClassName="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </BuyerFormField>

          <BuyerPrimaryButton type="submit" loading={isLoading}>
            Continue to Verification
          </BuyerPrimaryButton>
        </form>
      )}

      {currentStep === 2 && (
        <VerificationStep
          key={`phone-${formData.phone_number}`}
          type="phone"
          value={formData.phone_number}
          label="Enter Phone Verification Code"
          isLoading={isLoading}
          error={error}
          onVerify={handleVerifyPhoneOTP}
          onBack={() => setCurrentStep(1)}
          showDebugOtp={false}
        />
      )}

      {currentStep === 3 && (
        <VerificationStep
          key={`email-${formData.email}`}
          type="email"
          value={formData.email}
          label="Enter Email Verification Code"
          isLoading={isLoading}
          error={error}
          onVerify={handleVerifyEmailOTP}
          onBack={() => setCurrentStep(2)}
          showDebugOtp={false}
        />
      )}
    </BuyerAuthPanel>
  );
};

export default SignupModern;
