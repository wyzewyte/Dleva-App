import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import sellerAuth from '../../../../services/sellerAuth';

const SellerLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '', // Changed from email to username
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary tracking-tighter mb-2">Dleva<span className="text-dark">Seller</span></h1>
            <p className="text-gray-500 text-sm">Welcome back! Manage your kitchen.</p>
        </div>

        {/* ERROR ALERT (Only shows if there is an error) */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username or Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder="your username or email"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                </div>
            </div>

            {/* Password */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        className="w-full pl-10 pr-12 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                {/* Remember Me & Forgot Password */}
                <div className="flex justify-between items-center mt-3">
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="checkbox"
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                            checked={formData.rememberMe}
                            onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                        />
                        <span className="ml-2 text-xs text-gray-600 font-medium">Remember me</span>
                    </label>

                    <Link to="/seller/forgot-password" className="text-xs font-bold text-primary hover:underline">
                        Forgot Password?
                    </Link>
                </div>
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Login <ArrowRight size={18} /></>}
            </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500">
                Don't have a store yet?{' '}
                <Link to="/seller/register" className="font-bold text-primary hover:underline">
                    Register Now
                </Link>
            </p>
        </div>

      </div>
    </div>
  );
};

export default SellerLogin;