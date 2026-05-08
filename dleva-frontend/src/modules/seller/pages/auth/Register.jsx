import { AlertCircle, ArrowRight, ChefHat, Eye, EyeOff, Lock, Mail, Phone, Store, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import sellerAuth from '../../../../services/sellerAuth';
import toast from '../../../../services/toast';
import {
  SellerAuthPanel,
  SellerFormField,
  SellerPrimaryButton,
  SellerTextInput,
} from '../../components/ui/SellerPrimitives';

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    restaurantName: '',
    password: '',
    businessType: 'student_vendor',
  });

  const getErrorMessage = (err, fallback) => err.error || err.detail || err.message || fallback;

  const pauseForToast = () => new Promise((resolve) => {
    window.setTimeout(resolve, 700);
  });

  const payload = () => ({
    username: formData.username.trim(),
    first_name: formData.firstName.trim(),
    last_name: formData.lastName.trim(),
    email: formData.email.trim(),
    password: formData.password,
    phone: formData.phone.trim(),
    restaurant_name: formData.restaurantName.trim(),
    business_type: formData.businessType,
  });

  const handleRequestPhoneOTP = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const data = payload();
    if (!data.username || !data.first_name || !data.last_name || !data.restaurant_name || !data.email || !data.phone || !data.password) {
      setError('All fields are required.');
      setIsLoading(false);
      return;
    }

    try {
      await sellerAuth.requestPhoneOTP(data.phone);
      setOtpCode('');
      setCurrentStep(2);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send phone verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = payload();
      await sellerAuth.verifyPhoneOTP(data.phone, otpCode);
      toast.success('Phone number verified.');
      await pauseForToast();
      setOtpCode('');
      setCurrentStep(3);
      await sellerAuth.requestEmailOTP(data.email, data.restaurant_name);
      toast.success('Email verification code sent.');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid phone verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailAndRegister = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = payload();
      await sellerAuth.verifyEmailOTP(data.email, otpCode);
      toast.success('Email verified.');
      await pauseForToast();
      await sellerAuth.register(data);
      toast.success('Seller account created. Set your store location.');
      await pauseForToast();
      navigate('/seller/setup-location', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const title = currentStep === 1
    ? 'Create your seller account'
    : currentStep === 2
      ? 'Verify phone number'
      : 'Verify email address';

  return (
    <SellerAuthPanel
      title={title}
      subtitle="Sign up to become a Dleva seller."
      icon={<ChefHat size={36} />}
      footer={
        currentStep === 1 ? (
          <span>
            Already have an account?{' '}
            <Link to="/seller/login" className="font-bold text-primary hover:underline">
              Login here
            </Link>
          </span>
        ) : null
      }
    >
      {error ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <form onSubmit={handleRequestPhoneOTP} className="space-y-4">
          <SellerFormField label="Business type">
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'student_vendor', label: 'Student vendor', icon: ChefHat },
                { id: 'restaurant', label: 'Restaurant', icon: Store },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormData((previous) => ({ ...previous, businessType: option.id }))}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    formData.businessType === option.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 bg-[#fbfbfa] text-muted hover:text-dark'
                  }`}
                >
                  <option.icon size={20} />
                  <p className="mt-3 text-sm font-bold">{option.label}</p>
                </button>
              ))}
            </div>
          </SellerFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <SellerFormField label="Username">
              <SellerTextInput icon={User} value={formData.username} onChange={(event) => setFormData((previous) => ({ ...previous, username: event.target.value }))} placeholder="mama_fash" required />
            </SellerFormField>
            <SellerFormField label="Email address">
              <SellerTextInput icon={Mail} type="email" value={formData.email} onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))} placeholder="seller@example.com" required />
            </SellerFormField>
            <SellerFormField label="First name">
              <SellerTextInput icon={User} value={formData.firstName} onChange={(event) => setFormData((previous) => ({ ...previous, firstName: event.target.value }))} placeholder="Fashola" required />
            </SellerFormField>
            <SellerFormField label="Last name">
              <SellerTextInput icon={User} value={formData.lastName} onChange={(event) => setFormData((previous) => ({ ...previous, lastName: event.target.value }))} placeholder="Adebayo" required />
            </SellerFormField>
            <SellerFormField label={formData.businessType === 'restaurant' ? 'Restaurant name' : 'Business / kitchen name'} className="sm:col-span-2">
              <SellerTextInput icon={Store} value={formData.restaurantName} onChange={(event) => setFormData((previous) => ({ ...previous, restaurantName: event.target.value }))} placeholder={formData.businessType === 'restaurant' ? 'Mama Fash Restaurant' : 'Mama Fash Kitchen'} required />
            </SellerFormField>
            <SellerFormField label="Phone number" className="sm:col-span-2">
              <SellerTextInput icon={Phone} value={formData.phone} onChange={(event) => setFormData((previous) => ({ ...previous, phone: event.target.value }))} placeholder="+234 801 234 5678" required />
            </SellerFormField>
            <SellerFormField label="Create password" className="sm:col-span-2">
              <div className="relative">
                <SellerTextInput
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))}
                  placeholder="Create a strong password"
                  required
                />
                <button type="button" onClick={() => setShowPassword((previous) => !previous)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </SellerFormField>
          </div>

          <SellerPrimaryButton type="submit" loading={isLoading} icon={!isLoading ? <ArrowRight size={16} /> : null}>
            Continue to verification
          </SellerPrimaryButton>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={currentStep === 2 ? handleVerifyPhoneOTP : handleVerifyEmailAndRegister}>
          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-dark">
            <p className="font-bold">Verification code sent</p>
            <p className="mt-1 text-muted">
              Enter the code sent to {currentStep === 2 ? formData.phone : formData.email}.
            </p>
          </div>

          <SellerFormField label="Verification code">
            <SellerTextInput
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              required
            />
          </SellerFormField>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-muted hover:text-dark"
              disabled={isLoading}
              onClick={() => {
                setError('');
                setOtpCode('');
                setCurrentStep(currentStep === 2 ? 1 : 2);
              }}
            >
              Back
            </button>
            <SellerPrimaryButton type="submit" loading={isLoading}>
              Verify
            </SellerPrimaryButton>
          </div>
        </form>
      )}
    </SellerAuthPanel>
  );
};

export default Register;
