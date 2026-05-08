import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, BadgeInfo, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../../context/RiderAuthContext';
import riderAuth from '../../services/riderAuth';
import logo from '../../../../assets/images/logo.svg';
import toast from '../../../../services/toast';
import {
  RiderAuthPanel,
  RiderFormField,
  RiderPrimaryButton,
  RiderTextInput,
} from '../../components/ui/RiderPrimitives';

const OTP_LENGTH = 6;

const Register = () => {
  const navigate = useNavigate();
  const { token, loading, register } = useRiderAuth();
  const [step, setStep] = useState('form');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    vehicle_type: 'bike',
    vehicle_plate_number: '',
  });

  useEffect(() => {
    if (token && !loading && step === 'form') {
      navigate('/rider/dashboard', { replace: true });
    }
  }, [loading, navigate, step, token]);

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['full_name', 'username', 'email', 'phone_number', 'password', 'password_confirm', 'vehicle_type', 'vehicle_plate_number'];
    if (requiredFields.some((field) => !String(form[field] || '').trim())) {
      return 'All fields are required.';
    }
    if (form.password !== form.password_confirm) {
      return 'Passwords do not match.';
    }
    if (form.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  };

  const clearFeedback = () => {
    setError('');
  };

  const pauseForToast = () => new Promise((resolve) => {
    window.setTimeout(resolve, 700);
  });

  const handleRequestPhoneOtp = async (event) => {
    event.preventDefault();
    clearFeedback();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await riderAuth.requestPhoneOTP(form.phone_number.trim());
      setPhoneOtp('');
      setStep('phone');
    } catch (requestError) {
      setError(requestError?.error || 'Unable to send phone verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPhoneOtp = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (phoneOtp.length !== OTP_LENGTH) {
      setError('Enter the 6-digit phone verification code.');
      return;
    }

    setSubmitting(true);
    try {
      await riderAuth.verifyPhoneOTP(form.phone_number.trim(), phoneOtp);
      toast.success('Phone number verified.');
      await pauseForToast();
      setEmailOtp('');
      setPhoneOtp('');
      setStep('email');
      await riderAuth.requestEmailOTP(form.email.trim(), form.full_name.trim());
      toast.success('Email verification code sent.');
    } catch (verifyError) {
      setError(verifyError?.error || 'Unable to verify phone number.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmailAndRegister = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (emailOtp.length !== OTP_LENGTH) {
      setError('Enter the 6-digit email verification code.');
      return;
    }

    setSubmitting(true);
    try {
      await riderAuth.verifyEmailOTP(form.email.trim(), emailOtp);
      toast.success('Email verified.');
      await pauseForToast();
      await register(
        form.username.trim(),
        form.email.trim(),
        form.password,
        form.full_name.trim(),
        form.phone_number.trim(),
        form.vehicle_type,
        form.vehicle_plate_number.trim()
      );
      toast.success('Rider account created. Complete your verification setup.');
      await pauseForToast();
      navigate('/rider/verification-setup', { replace: true });
    } catch (registerError) {
      setError(registerError?.error || 'Unable to create your rider account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const feedback = (
    <>
      {error ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </>
  );

  const title = step === 'form'
    ? 'Create your rider account'
    : step === 'phone'
      ? 'Verify phone number'
      : 'Verify email address';

  return (
    <RiderAuthPanel
      title={title}
      subtitle="Sign up to become a Dleva rider."
      showBack
      onBack={() => (step === 'form' ? navigate('/home') : setStep(step === 'email' ? 'phone' : 'form'))}
      icon={<img src={logo} alt="Dleva" className="h-20 w-auto sm:h-24" />}
      footer={
        <>
          Already have a rider account?{' '}
          <Link to="/rider/login" className="font-semibold text-primary">
            Login
          </Link>
        </>
      }
    >
      {step === 'form' ? (
        <form onSubmit={handleRequestPhoneOtp} className="space-y-4">
          {feedback}

          <RiderFormField label="Full name">
            <RiderTextInput value={form.full_name} onChange={(event) => handleChange('full_name', event.target.value)} icon={User} placeholder="John Doe" />
          </RiderFormField>

          <RiderFormField label="Username">
            <RiderTextInput value={form.username} onChange={(event) => handleChange('username', event.target.value)} icon={BadgeInfo} placeholder="rider_username" />
          </RiderFormField>

          <RiderFormField label="Email">
            <RiderTextInput type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} icon={Mail} placeholder="you@example.com" />
          </RiderFormField>

          <RiderFormField label="Phone">
            <RiderTextInput value={form.phone_number} onChange={(event) => handleChange('phone_number', event.target.value)} icon={Phone} placeholder="+234..." />
          </RiderFormField>

          <RiderFormField label="Password">
            <div className="relative">
              <RiderTextInput
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => handleChange('password', event.target.value)}
                icon={Lock}
                placeholder="Create a password"
                inputClassName="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-dark"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </RiderFormField>

          <RiderFormField label="Confirm password">
            <div className="relative">
              <RiderTextInput
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.password_confirm}
                onChange={(event) => handleChange('password_confirm', event.target.value)}
                icon={Lock}
                placeholder="Confirm your password"
                inputClassName="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-dark"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </RiderFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <RiderFormField label="Vehicle type">
              <select
                value={form.vehicle_type}
                onChange={(event) => handleChange('vehicle_type', event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="bike">Bike</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
              </select>
            </RiderFormField>

            <RiderFormField label="Plate number">
              <RiderTextInput value={form.vehicle_plate_number} onChange={(event) => handleChange('vehicle_plate_number', event.target.value)} placeholder="ABC-1234" />
            </RiderFormField>
          </div>

          <RiderPrimaryButton type="submit" loading={submitting} icon={<ArrowRight size={16} />}>
            Verify phone
          </RiderPrimaryButton>
        </form>
      ) : null}

      {step === 'phone' ? (
        <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
          {feedback}

          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-dark">
            <p className="font-bold">Verification code sent</p>
            <p className="mt-1 text-muted">Enter the code sent to {form.phone_number}.</p>
          </div>

          <RiderFormField label="Verification code">
            <RiderTextInput
              value={phoneOtp}
              onChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              placeholder="000000"
              required
            />
          </RiderFormField>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-muted hover:text-dark"
              disabled={submitting}
              onClick={() => {
                setError('');
                setPhoneOtp('');
                setStep('form');
              }}
            >
              Back
            </button>
            <RiderPrimaryButton type="submit" loading={submitting}>
              Verify
            </RiderPrimaryButton>
          </div>
        </form>
      ) : null}

      {step === 'email' ? (
        <form onSubmit={handleVerifyEmailAndRegister} className="space-y-4">
          {feedback}

          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-dark">
            <p className="font-bold">Verification code sent</p>
            <p className="mt-1 text-muted">Enter the code sent to {form.email}.</p>
          </div>

          <RiderFormField label="Verification code">
            <RiderTextInput
              value={emailOtp}
              onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              placeholder="000000"
              required
            />
          </RiderFormField>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-muted hover:text-dark"
              disabled={submitting}
              onClick={() => {
                setError('');
                setEmailOtp('');
                setStep('phone');
              }}
            >
              Back
            </button>
            <RiderPrimaryButton type="submit" loading={submitting}>
              Verify
            </RiderPrimaryButton>
          </div>
        </form>
      ) : null}
    </RiderAuthPanel>
  );
};

export default Register;
