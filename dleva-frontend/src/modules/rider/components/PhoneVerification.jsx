/**
 * PhoneVerification Component
 * Handles phone number verification via OTP
 */

import { useState } from 'react';
import { Loader2, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import riderSettings from '../services/riderSettings';
import { SETTINGS_ERRORS, SETTINGS_SUCCESS } from '../constants/settingsConstants';

const PhoneVerification = ({ profile, onVerified }) => {
  const [step, setStep] = useState(profile?.phone_verified ? 'verified' : 'request');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await riderSettings.requestPhoneOtp(phone);
      setMessage('OTP sent to your phone. Check your messages.');
      setStep('verify');
      setResendTimer(60);
    } catch (err) {
      setError(err.error || SETTINGS_ERRORS.PHONE_VERIFY_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await riderSettings.verifyPhone(otp);
      setMessage(SETTINGS_SUCCESS.PHONE_VERIFIED);
      setStep('verified');
      setOtp('');
      if (onVerified) onVerified();
    } catch (err) {
      setError(err.error || SETTINGS_ERRORS.OTP_INVALID);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  if (resendTimer > 0) {
    setTimeout(() => setResendTimer(resendTimer - 1), 1000);
  }

  return (
    <div className="bg-white rounded-2xl p-6 space-y-4 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <Phone size={22} className="text-primary" />
        <h3 className="font-bold text-dark text-lg">Phone Verification</h3>
        {step === 'verified' && (
          <CheckCircle2 size={20} className="text-success ml-auto" />
        )}
      </div>

      {error && (
        <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {message && (
        <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      {step === 'verified' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-600" />
            <p className="font-bold text-green-700">Phone Verified</p>
          </div>
          <p className="text-sm text-green-600">{phone}</p>
        </div>
      ) : step === 'request' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              We sent a 6-digit code to <span className="font-bold">{phone}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl font-bold tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="flex-1 text-sm text-primary hover:underline font-bold"
            >
              Change Number
            </button>
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={resendTimer > 0}
              className="flex-1 text-sm text-primary hover:underline font-bold disabled:opacity-50"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneVerification;
