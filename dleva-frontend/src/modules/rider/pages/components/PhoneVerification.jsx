import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import riderSettings from '../../services/riderSettings';
import {
  SETTINGS_ERRORS,
  SETTINGS_SUCCESS,
  SETTINGS_INFO,
  OTP_CONFIG,
  SETTINGS_LABELS,
} from '../../constants/settingsConstants';

const PhoneVerification = ({ profile, onVerified }) => {
  const [step, setStep] = useState(profile?.phone_verified ? 'verified' : 'request');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await riderSettings.requestPhoneOtp(phone);
      setMessage(SETTINGS_SUCCESS.OTP_SENT);
      setStep('verify');
      setResendTimer(OTP_CONFIG.RESEND_TIMER);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.OTP_REQUEST_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter OTP');
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
      onVerified?.();
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.PHONE_VERIFICATION_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await riderSettings.requestPhoneOtp(phone);
      setMessage(SETTINGS_SUCCESS.OTP_RESENT);
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
    setPhone(profile?.phone_number || '');
    setOtp('');
    setError('');
    setMessage('');
  };

  const handleOtpChange = (input) => {
    // Only allow digits and limit to 6
    const digitsOnly = input.replace(/\D/g, '').slice(0, OTP_CONFIG.OTP_LENGTH);
    setOtp(digitsOnly);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Phone size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">{SETTINGS_LABELS.PHONE_VERIFICATION}</h3>
      </div>

      {step === 'verified' ? (
        // Verified State
        <div className="text-center py-8">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{SETTINGS_INFO.PHONE_VERIFIED}</h4>
          <p className="text-gray-600 mb-6">{profile?.phone_number}</p>
          <button
            onClick={handleChangeNumber}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {SETTINGS_INFO.CHANGE_NUMBER}
          </button>
        </div>
      ) : step === 'verify' ? (
        // OTP Verification State
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              {SETTINGS_INFO.ENTER_6_DIGIT_OTP} <strong>{phone}</strong>
            </p>
          </div>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {SETTINGS_INFO.ENTER_OTP}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder={SETTINGS_INFO.OTP_PLACEHOLDER}
              maxLength={OTP_CONFIG.OTP_LENGTH}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          {/* Resend Timer */}
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-600">
                {SETTINGS_INFO.RESEND_OTP} <strong>{resendTimer}</strong>s
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {SETTINGS_INFO.RESEND_OTP}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== OTP_CONFIG.OTP_LENGTH}
              className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {SETTINGS_INFO.VERIFYING}
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {SETTINGS_INFO.VERIFY_OTP}
                </>
              )}
            </button>
            <button
              onClick={handleChangeNumber}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              {SETTINGS_INFO.CHANGE_NUMBER}
            </button>
          </div>
        </div>
      ) : (
        // Request OTP State
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              {SETTINGS_INFO.PHONE_VERIFICATION_INFO}
            </p>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {SETTINGS_LABELS.PHONE_NUMBER}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          {/* Send OTP Button */}
          <button
            onClick={handleRequestOtp}
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                {SETTINGS_INFO.SENDING_OTP}
              </>
            ) : (
              <>
                <Phone size={16} />
                {SETTINGS_INFO.SEND_OTP}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
