import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Phone, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderSettings from '../services/riderSettings';
import {
  SETTINGS_ERRORS,
  SETTINGS_SUCCESS,
  SETTINGS_INFO,
  OTP_CONFIG,
  SETTINGS_LABELS,
} from '../constants/settingsConstants';
import {
  RiderCard,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSecondaryButton,
  RiderStatusBadge,
  RiderTextInput,
} from '../components/ui/RiderPrimitives';

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

  useEffect(() => {
    if (rider?.phone_verified) {
      setStep('verified');
    }
    if (rider?.phone_number && !phone) {
      setPhone(rider.phone_number);
    }
  }, [phone, rider]);

  useEffect(() => {
    if (resendTimer <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResendTimer((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const clearFeedback = () => {
    setError('');
    setMessage('');
  };

  const handleRequestOtp = async (event) => {
    event?.preventDefault();

    if (!phone.trim()) {
      setError(SETTINGS_ERRORS.PHONE_REQUIRED);
      return;
    }

    setLoading(true);
    clearFeedback();

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

  const handleVerifyOtp = async (event) => {
    event?.preventDefault();

    if (otp.length !== OTP_CONFIG.OTP_LENGTH) {
      setError(SETTINGS_ERRORS.INVALID_OTP);
      return;
    }

    setLoading(true);
    clearFeedback();

    try {
      await riderSettings.verifyPhone(otp, phone);
      setMessage(SETTINGS_SUCCESS.PHONE_VERIFIED);
      setStep('verified');

      if (refreshRider) {
        await refreshRider();
      }
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.PHONE_VERIFICATION_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) {
      return;
    }

    setLoading(true);
    clearFeedback();

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

  return (
    <RiderPageShell maxWidth="max-w-3xl" withBottomNavSpacing={false}>
      <RiderPageHeader
        title="Phone verification"
        subtitle="Keep your rider account reachable for delivery updates and support."
        showBack
        onBack={() => navigate('/rider/verification-setup')}
        sticky
      />

      <div className="space-y-6 py-6">
        <RiderCard className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Smartphone size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-dark">Current phone</h2>
                <RiderStatusBadge status={step === 'verified' ? 'approved' : 'pending'}>
                  {step === 'verified' ? 'Verified' : 'Pending'}
                </RiderStatusBadge>
              </div>
              <p className="mt-2 text-sm text-muted">{phone || 'Add your phone number to receive a one-time code.'}</p>
            </div>
          </div>
        </RiderCard>

        {error ? (
          <RiderCard className="border-red-100 bg-red-50 p-4">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </RiderCard>
        ) : null}

        {message ? (
          <RiderCard className="border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3 text-emerald-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{message}</p>
            </div>
          </RiderCard>
        ) : null}

        {step === 'request' ? (
          <RiderCard className="p-5 sm:p-6">
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-dark">Request code</h3>
                <p className="mt-1 text-sm text-muted">{SETTINGS_INFO.PHONE_VERIFICATION_INFO}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {SETTINGS_LABELS.PHONE_NUMBER}
                </label>
                <RiderTextInput
                  icon={Phone}
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+234..."
                  disabled={loading}
                />
              </div>

              <RiderPrimaryButton type="submit" loading={loading} disabled={!phone.trim()}>
                {loading ? SETTINGS_INFO.SENDING_OTP : SETTINGS_INFO.SEND_OTP}
              </RiderPrimaryButton>
            </form>
          </RiderCard>
        ) : null}

        {step === 'verify' ? (
          <RiderCard className="p-5 sm:p-6">
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-dark">Enter verification code</h3>
                <p className="mt-1 text-sm text-muted">We sent a 6-digit code to {phone}.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {SETTINGS_INFO.ENTER_OTP}
                </label>
                <input
                  type="text"
                  maxLength={OTP_CONFIG.OTP_LENGTH}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  placeholder={SETTINGS_INFO.OTP_PLACEHOLDER}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.4em] text-dark placeholder:text-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <RiderPrimaryButton type="submit" loading={loading} disabled={otp.length !== OTP_CONFIG.OTP_LENGTH} className="sm:flex-1">
                  {loading ? SETTINGS_INFO.VERIFYING : SETTINGS_INFO.VERIFY_OTP}
                </RiderPrimaryButton>
                <RiderSecondaryButton type="button" onClick={() => { setStep('request'); setOtp(''); }} className="sm:flex-1">
                  {SETTINGS_INFO.CHANGE_NUMBER}
                </RiderSecondaryButton>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-muted">
                {resendTimer > 0 ? (
                  <p>
                    {SETTINGS_INFO.RESEND_OTP} in <span className="font-semibold text-dark">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-semibold text-primary transition-colors hover:opacity-80"
                  >
                    {SETTINGS_INFO.RESEND_OTP}
                  </button>
                )}
              </div>
            </form>
          </RiderCard>
        ) : null}

        {step === 'verified' ? (
          <RiderCard className="p-6 text-center sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-dark">{SETTINGS_INFO.PHONE_VERIFIED}</h3>
            <p className="mt-2 text-sm text-muted">{SETTINGS_INFO.PHONE_VERIFIED_DESC}</p>
            <RiderPrimaryButton className="mt-6 sm:w-auto sm:px-6" onClick={() => navigate('/rider/verification-setup')}>
              Continue
            </RiderPrimaryButton>
          </RiderCard>
        ) : null}
      </div>
    </RiderPageShell>
  );
};

export default PhoneVerification;
