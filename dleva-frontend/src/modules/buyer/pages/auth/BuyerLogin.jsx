import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../auth/context/AuthContext';
import { logError } from '../../../../utils/errorHandler';

const BuyerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const profile = await login(formData.username, formData.password);
      
      // Do NOT force location setup; if address missing show a non-blocking prompt
      if (!profile?.address) {
        // optional: show a toast / banner or small modal asking user to set location
        // navigate('/setup-location'); // <-- remove this forced navigation
      }
      navigate('/home'); // or home

    } catch (err) {
      setIsLoading(false);
      logError(err, { context: 'BuyerLogin.handleSubmit' });
      const errorMsg = err.response?.data?.error || err.message || "Login failed";
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center p-6">
      <div className="w-full max-w-md mx-auto space-y-8">
        
        <div className="text-center">
            <h1 className="text-3xl font-bold text-dark mb-2">Welcome Back 👋</h1>
            <p className="text-gray-500">Hungry? Log in to find food nearby.</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex gap-2">
                <AlertCircle size={18} /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                <div className="relative mt-1">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. student123"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        className="w-full pl-10 pr-12 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Login <ArrowRight size={20} /></>}
            </button>
        </form>

        <p className="text-center text-sm text-gray-500">
            New here? <Link to="/signup" className="text-primary font-bold">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default BuyerLogin;