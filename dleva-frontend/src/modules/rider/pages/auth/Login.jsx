import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../../context/RiderAuthContext';
import logo from '../../../../assets/images/logo.svg';
import {
  RiderAuthPanel,
  RiderFormField,
  RiderPrimaryButton,
  RiderTextInput,
} from '../../components/ui/RiderPrimitives';

const Login = () => {
  const navigate = useNavigate();
  const { token, loading, login } = useRiderAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && !loading) {
      navigate('/rider/dashboard', { replace: true });
    }
  }, [loading, navigate, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      navigate('/rider/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError?.error || 'Invalid rider credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RiderAuthPanel
      title="Rider Login"
      subtitle="Sign in to continue your delivery."
      showBack
      onBack={() => navigate('/home')}
      icon={<img src={logo} alt="Dleva" className="h-20 w-auto sm:h-24" />}
      footer={
        <>
          Don&apos;t have a rider account?{' '}
          <Link to="/rider/register" className="font-semibold text-primary">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <RiderFormField label="Email" error={error}>
          <RiderTextInput
            type="email"
            icon={Mail}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </RiderFormField>

        <RiderFormField label="Password">
          <div className="relative">
            <RiderTextInput
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
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

        <RiderPrimaryButton type="submit" loading={submitting} icon={<ArrowRight size={16} />}>
          Login
        </RiderPrimaryButton>
      </form>
    </RiderAuthPanel>
  );
};

export default Login;
