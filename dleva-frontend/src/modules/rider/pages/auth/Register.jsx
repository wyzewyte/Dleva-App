import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Phone, User, ArrowRight, BadgeInfo } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../../context/RiderAuthContext';
import logo from '../../../../assets/images/logo.svg';
import {
  RiderAuthPanel,
  RiderFormField,
  RiderPrimaryButton,
  RiderTextInput,
} from '../../components/ui/RiderPrimitives';

const Register = () => {
  const navigate = useNavigate();
  const { token, loading, register } = useRiderAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
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
    if (token && !loading) {
      navigate('/rider/dashboard', { replace: true });
    }
  }, [loading, navigate, token]);

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      await register(
        form.username,
        form.email,
        form.password,
        form.full_name,
        form.phone_number,
        form.vehicle_type,
        form.vehicle_plate_number
      );
      navigate('/rider/verification-setup', { replace: true });
    } catch (registerError) {
      setError(registerError?.error || 'Unable to create your rider account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RiderAuthPanel
      title="Create Rider Account"
      subtitle="Open a rider account with the essentials first, then finish verification in one clear next step."
      showBack
      onBack={() => navigate('/home')}
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <RiderFormField label="Full name" error={error}>
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
          Create account
        </RiderPrimaryButton>
      </form>
    </RiderAuthPanel>
  );
};

export default Register;
