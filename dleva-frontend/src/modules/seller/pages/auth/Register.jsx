import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Store, Phone, Loader2, ChefHat, AlertCircle, User } from 'lucide-react';
import sellerAuth from '../../../../services/sellerAuth';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    restaurantName: '',
    password: '',
    businessType: 'student_vendor'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }
    
    if (!formData.firstName.trim()) {
      setError('First name is required');
      setIsLoading(false);
      return;
    }
    
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      setIsLoading(false);
      return;
    }
    
    if (!formData.restaurantName.trim()) {
      setError('Restaurant name is required');
      setIsLoading(false);
      return;
    }

    try {
      await sellerAuth.register({
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        restaurant_name: formData.restaurantName,
        business_type: formData.businessType,
      });
      
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark">Join Dleva</h1>
            <p className="text-gray-500 text-sm">Start selling food to students today.</p>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* --- 1. BUSINESS TYPE SELECTOR (Simple & Visual) --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                    {/* Option A: Student Vendor */}
                    <div 
                        onClick={() => setFormData({...formData, businessType: 'student_vendor'})}
                        className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${formData.businessType === 'student_vendor' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                    >
                        <ChefHat size={24} className="mb-1" />
                        <span className="text-xs font-bold">Student Vendor</span>
                    </div>

                    {/* Option B: Restaurant */}
                    <div 
                        onClick={() => setFormData({...formData, businessType: 'restaurant'})}
                        className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${formData.businessType === 'restaurant' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                    >
                        <Store size={24} className="mb-1" />
                        <span className="text-xs font-bold">Restaurant</span>
                    </div>
                </div>
            </div>

            {/* --- 2. USERNAME --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder="e.g. chef_mama"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                </div>
            </div>

            {/* --- 3. FIRST NAME --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder="e.g. Zainab"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                </div>
            </div>

            {/* --- 4. LAST NAME --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder="e.g. Ibrahim"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                </div>
            </div>

            {/* --- 5. RESTAURANT NAME --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    {formData.businessType === 'restaurant' ? 'Restaurant Name' : 'Business / Kitchen Name'}
                </label>
                <div className="relative">
                    <Store className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder={formData.businessType === 'restaurant' ? "e.g. Meddys Buka" : "e.g. Tunde's Kitchen"}
                        value={formData.restaurantName}
                        onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                    />
                </div>
            </div>

            {/* --- 6. EMAIL --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder="name@business.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
            </div>

             {/* --- 7. PHONE --- */}
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="tel" 
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        placeholder="080..."
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
            </div>

            {/* --- 8. PASSWORD --- */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Create Password</label>
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
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20 mt-2 disabled:opacity-70"
            >
                {isLoading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Create Account'}
            </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/seller/login" className="font-bold text-primary hover:underline">
                    Login Here
                </Link>
            </p>
        </div>

      </div>
    </div>
  );
};

export default Register;