import { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import { logError } from '../../../../utils/errorHandler';
import brandLogo from '../../../../assets/images/logo.svg';
import {
  BuyerAuthPanel,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerTextInput,
} from '../../components/ui/BuyerPrimitives';

const BuyerLoginModern = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const redirectUrl = searchParams.get('next');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password);
      window.location.replace(redirectUrl || '/home');
    } catch (err) {
      logError(err, { context: 'BuyerLoginModern.handleSubmit' });
      setError(err.response?.data?.error || err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Welcome Back"
      icon={<img src={brandLogo} alt="Dleva" className="h-14 w-14 sm:h-16 sm:w-16" />}
      showBack
      onBack={() => navigate('/home')}
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-primary">
            Create Account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <BuyerFeedbackState type="error" title="Login failed" message={error} /> : null}

        <BuyerFormField label="Username">
          <BuyerTextInput
            icon={User}
            value={formData.username}
            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="e.g. student123"
            required
          />
        </BuyerFormField>

        <BuyerFormField label="Password">
          <div className="relative">
            <BuyerTextInput
              icon={Lock}
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

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
            Forgot Password?
          </Link>
        </div>

        <BuyerPrimaryButton type="submit" loading={isLoading}>
          Login
        </BuyerPrimaryButton>
      </form>
    </BuyerAuthPanel>
  );
};

export default BuyerLoginModern;
