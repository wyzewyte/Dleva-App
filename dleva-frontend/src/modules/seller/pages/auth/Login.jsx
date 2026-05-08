import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Store } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import sellerAuth from '../../../../services/sellerAuth';
import {
  SellerAuthPanel,
  SellerFormField,
  SellerPrimaryButton,
  SellerTextInput,
} from '../../components/ui/SellerPrimitives';

const SellerLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '', rememberMe: false });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await sellerAuth.login(formData.username, formData.password);
      localStorage.setItem('seller_username', formData.username);
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.error || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SellerAuthPanel
      title="Welcome back"
      subtitle="Login to access your dashboard."
      icon={<Store size={36} />}
      footer={
        <span>
          Don&apos;t have a seller account?{' '}
          <Link to="/seller/register" className="font-bold text-primary hover:underline">
            Register now
          </Link>
        </span>
      }
    >
      {error ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <SellerFormField label="Username">
          <SellerTextInput
            icon={Mail}
            value={formData.username}
            onChange={(event) => setFormData((previous) => ({ ...previous, username: event.target.value }))}
            placeholder="your username"
            required
          />
        </SellerFormField>

        <SellerFormField label="Password">
          <div className="relative">
            <SellerTextInput
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </SellerFormField>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(event) => setFormData((previous) => ({ ...previous, rememberMe: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Remember me
          </label>
          <Link to="/seller/forgot-password" className="font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <SellerPrimaryButton type="submit" loading={isLoading} icon={!isLoading ? <ArrowRight size={16} /> : null}>
          Login
        </SellerPrimaryButton>
      </form>
    </SellerAuthPanel>
  );
};

export default SellerLogin;
