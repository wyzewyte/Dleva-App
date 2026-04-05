import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Phone } from 'lucide-react';
import riderSettings from '../../services/riderSettings';

const digits = (value) => String(value || '').replace(/\D/g, '');

const PhoneVerification = ({ phone, verifiedPhone, phoneVerified = false, onVerified }) => {
  const [step, setStep] = useState('request');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const isCurrentPhoneVerified = phoneVerified && digits(phone) && digits(phone) === digits(verifiedPhone);

  useEffect(() => {
    setStep(isCurrentPhoneVerified ? 'verified' : 'request');
    setOtp('');
    setError('');
    setMessage('');
    setResendTimer(0);
  }, [isCurrentPhoneVerified, phone]);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const timer = window.setTimeout(() => setResendTimer((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      setError('Enter a phone number first.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await riderSettings.requestPhoneOtp(phone.trim());
      setMessage('Verification code sent.');
      setStep('verify');
      setResendTimer(60);
    } catch (err) {
      setError(err?.error || err?.message || 'Unable to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await riderSettings.verifyPhone(otp.trim(), phone.trim());
      setMessage('Phone number verified.');
      setStep('verified');
      onVerified?.(phone.trim());
    } catch (err) {
      setError(err?.error || err?.message || 'Unable to verify phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (typeof riderSettings.resendPhoneOtp === 'function') {
        await riderSettings.resendPhoneOtp(phone.trim());
      } else {
        await riderSettings.requestPhoneOtp(phone.trim());
      }
      setMessage('Verification code resent.');
      setResendTimer(60);
      setOtp('');
    } catch (err) {
      setError(err?.error || err?.message || 'Unable to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[22px] border border-gray-200 bg-gray-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-primary" />
            <h4 className="text-base font-bold text-dark">Phone verification</h4>
          </div>
          <p className="mt-1 text-sm text-muted">
            {isCurrentPhoneVerified ? 'This number is verified.' : 'Verify the current phone number before you leave this screen.'}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${isCurrentPhoneVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          {isCurrentPhoneVerified ? 'Verified' : 'Pending'}
        </span>
      </div>

      {step === 'verify' ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Enter the code sent to <span className="font-semibold">{phone}</span>.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-dark placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          {error ? <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div> : null}
          {message ? <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle size={16} className="mt-0.5 shrink-0" />{message}</div> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={16} />}
              Verify number
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || resendTimer > 0}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-dark transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {error ? <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div> : null}
          {message ? <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle size={16} className="mt-0.5 shrink-0" />{message}</div> : null}
          {!isCurrentPhoneVerified ? (
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading || !phone.trim()}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Phone size={16} />}
              Send verification code
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
