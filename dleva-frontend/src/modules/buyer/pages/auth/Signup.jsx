import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../../services/axios'; // Use the central api instance
import { useAuth } from '../../../auth/context/AuthContext'; // Import useAuth

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth(); // Get the login function from context

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: ''
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/buyer/register/', formData);
      
      // Use the context's login function to set the new session
      const { access, user } = response.data;
      login(access, user);

      navigate('/setup-location');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center px-6 py-12 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <h1 className="text-3xl font-bold text-primary tracking-tighter mb-2">Dleva</h1>
        <h2 className="text-2xl font-bold text-dark">Create an account</h2>
        <p className="mt-2 text-sm text-muted">
          Join Dleva and get food delivered fast.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex gap-2 mb-4">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Full Name</label>
            <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  required 
                  className="block w-full rounded-xl border-0 py-3 pl-10 text-dark shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary bg-gray-50" 
                  placeholder="Chika Okonkwo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Email</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required 
                  className="block w-full rounded-xl border-0 py-3 pl-10 text-dark shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary bg-gray-50" 
                  placeholder="chika@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Username</label>
            <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  required 
                  className="block w-full rounded-xl border-0 py-3 pl-10 text-dark shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary bg-gray-50" 
                  placeholder="chika123"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required 
                  className="block w-full rounded-xl border-0 py-3 pl-10 text-dark shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary bg-gray-50" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="flex w-full justify-center rounded-xl bg-primary px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-hover transition-colors gap-2 items-center mt-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Create Account <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-muted">
          Already a member?{' '}
          <Link to="/login" className="font-semibold leading-6 text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;