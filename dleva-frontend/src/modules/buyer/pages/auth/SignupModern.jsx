import { useState } from 'react';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../../services/axios';
import { useAuth } from '../../../auth/context/AuthContext';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
  });

  const redirectUrl = searchParams.get('next');

  const handleSignup = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.post('/buyer/register/', formData);
      await login(formData.username, formData.password);
      window.location.replace(redirectUrl || '/setup-location');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
      setIsLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Create Account"
      icon={<img src={brandLogo} alt="Dleva" className="h-14 w-14 sm:h-16 sm:w-16" />}
      showBack
      onBack={() => navigate('/home')}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSignup}>
        {error ? <BuyerFeedbackState type="error" title="Could not create account" message={error} /> : null}

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
          Create Account
        </BuyerPrimaryButton>
      </form>
    </BuyerAuthPanel>
  );
};

export default SignupModern;
