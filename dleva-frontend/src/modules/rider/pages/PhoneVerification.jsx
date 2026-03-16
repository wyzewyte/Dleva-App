/**
 * Rider Phone Verification Page
 * Handles requesting and verifying OTP for phone number
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, CheckCircle, AlertCircle, Loader2, ArrowLeft, Smartphone } from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderSettings from '../services/riderSettings';
import {
  SETTINGS_ERRORS,
  SETTINGS_SUCCESS,
  SETTINGS_INFO,
  OTP_CONFIG,
  SETTINGS_LABELS,
} from '../constants/settingsConstants';

const PhoneVerification = () => {
  const navigate = useNavigate();
  const { rider, refreshRider } = useRiderAuth();
  
  const [step, setStep] = useState(rider?.phone_verified ? 'verified' : 'request');
  const [phone, setPhone] = useState(rider?.phone_number || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Sync with rider profile if it changes
  useEffect(() => {
    if (rider?.phone_verified) {
      setStep('verified');
    }
    if (rider?.phone_number && !phone) {
      setPhone(rider.phone_number);
    }
  }, [rider, phone]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    
    if (!phone.trim()) {
      setError(SETTINGS_ERRORS.PHONE_REQUIRED);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await riderSettings.requestPhoneOtp(phone);
      setMessage(response?.debug_otp ? `${SETTINGS_SUCCESS.OTP_SENT} (${response.debug_otp})` : SETTINGS_SUCCESS.OTP_SENT);
      setStep('verify');
      setResendTimer(OTP_CONFIG.RESEND_TIMER);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.OTP_REQUEST_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();

    if (!otp.trim()) {
      setError(SETTINGS_ERRORS.INVALID_OTP);
      return;
    }

    if (otp.length !== OTP_CONFIG.OTP_LENGTH) {
      setError(SETTINGS_ERRORS.INVALID_OTP);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await riderSettings.verifyPhone(otp, phone);
      setMessage(SETTINGS_SUCCESS.PHONE_VERIFIED);
      setStep('verified');
      
      // Refresh rider profile to update global state
      if (refreshRider) await refreshRider();
      
      // Auto-navigate back to setup after a short delay
      setTimeout(() => {
        navigate('/rider/verification-setup');
      }, 2000);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.PHONE_VERIFICATION_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await riderSettings.resendPhoneOtp(phone);
      setMessage(response?.debug_otp ? `${SETTINGS_SUCCESS.OTP_RESENT} (${response.debug_otp})` : SETTINGS_SUCCESS.OTP_RESENT);
      setResendTimer(OTP_CONFIG.RESEND_TIMER);
      setOtp('');
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.OTP_REQUEST_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep('request');
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/rider/verification-setup')}
          className="flex items-center text-gray-600 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Verification
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Smartphone size={32} />
            </div>
            <h1 className="text-2xl font-bold">Phone Verification</h1>
            <p className="text-white/80 mt-2">
              Secure your account and stay reachable
            </p>
          </div>

          <div className="p-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-start gap-3">
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            {/* STEP 1: Request OTP */}
            {step === 'request' && (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {SETTINGS_LABELS.PHONE_NUMBER}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234..."
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                    {SETTINGS_INFO.PHONE_VERIFICATION_INFO}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {SETTINGS_INFO.SENDING_OTP}
                    </>
                  ) : (
                    SETTINGS_INFO.SEND_OTP
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="font-bold text-gray-900 mt-1">{phone}</p>
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-primary text-xs font-semibold hover:underline mt-2"
                  >
                    {SETTINGS_INFO.CHANGE_NUMBER}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    {SETTINGS_INFO.ENTER_OTP}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder={SETTINGS_INFO.OTP_PLACEHOLDER}
                    className="block w-full text-center text-3xl tracking-[0.5em] font-bold py-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {SETTINGS_INFO.VERIFYING}
                    </>
                  ) : (
                    SETTINGS_INFO.VERIFY_OTP
                  )}
                </button>

                <div className="text-center pt-4">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      {SETTINGS_INFO.RESEND_OTP} in{' '}
                      <span className="font-bold text-primary">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-primary font-bold hover:underline text-sm"
                    >
                      {SETTINGS_INFO.RESEND_OTP}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* STEP 3: Verified Success */}
            {step === 'verified' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {SETTINGS_INFO.PHONE_VERIFIED}
                </h2>
                <p className="text-gray-600">
                  {SETTINGS_INFO.PHONE_VERIFIED_DESC}
                </p>
                <div className="mt-10 p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-sm text-green-800 font-medium">
                    Redirecting to verification setup...
                  </p>
                </div>
                <button
                  onClick={() => navigate('/rider/verification-setup')}
                  className="mt-8 w-full border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
          <h3 className="text-sm font-bold text-blue-900 mb-2">
            Why verify your phone?
          </h3>
          <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
            <li>Receive instant delivery notifications</li>
            <li>Directly contact customers for smoother deliveries</li>
            <li>Essential for secure payout processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;
