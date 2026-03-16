import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, KeyRound, CheckCircle2, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import buyerProfile from '../../../services/buyerProfile';
import { validatePassword } from '../../../utils/validators';
import { getMessage } from '../../../constants/messages';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Toggle States for visibility
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => {
        setSuccess(null);
        navigate('/profile');
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [success, navigate]);

  const parseErrorMessage = (data) => {
    if (!data) return 'Failed to change password';
    if (typeof data === 'string') return data;
    if (data.detail) return String(data.detail);
    const fields = ['old_password', 'new_password', 'confirm_password', 'non_field_errors'];
    for (const f of fields) {
      if (data[f]) {
        if (Array.isArray(data[f])) return data[f].join(' ');
        return String(data[f]);
      }
    }
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      if (Array.isArray(val)) return val.join(' ');
      return String(val);
    }
    return JSON.stringify(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate passwords
    const newPwdValidation = validatePassword(newPassword);
    if (!newPwdValidation.isValid) {
      setError(newPwdValidation.error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await buyerProfile.changePassword(oldPassword, newPassword);
      setSuccess(getMessage('PASSWORD_CHANGED'));
    } catch (err) {
      const data = err.response?.data;
      const msg = parseErrorMessage(data) || err.message || getMessage('PASSWORD_CHANGE_FAILED');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header / Nav Back */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 px-4 sm:px-0">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-500 hover:text-dark transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Profile
        </button>
        <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <KeyRound size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Change Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
            Please enter your current password to set a new one.
            </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Top notification bars */}
        {success && (
          <div className="mb-4 px-4">
            <div className="relative rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 flex items-start gap-3">
              <CheckCircle2 className="shrink-0 text-emerald-600" size={18} />
              <div className="flex-1 text-sm font-medium">{String(success)}</div>
              <button onClick={() => setSuccess(null)} className="pl-3">
                <X size={16} className="text-emerald-600" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4">
            <div className="relative rounded-xl bg-red-50 border border-red-100 text-red-700 p-3 flex items-start gap-3">
              <AlertCircle className="shrink-0 text-red-600" size={18} />
              <div className="flex-1 text-sm font-medium">{String(error)}</div>
              <button onClick={() => setError(null)} className="pl-3">
                <X size={16} className="text-red-600" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Old Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                Current Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showOld ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  // Changed pr-3 to pr-10 to make room for the eye icon
                  className="block w-full pl-10 pr-10 py-3 border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                New Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  // Changed pr-3 to pr-10
                  className="block w-full pl-10 pr-10 py-3 border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                Confirm New Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircle2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  // Changed pr-3 to pr-10
                  className="block w-full pl-10 pr-10 py-3 border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
                <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>Updating...</span>
                    </div>
                ) : (
                    'Update Password'
                )}
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;