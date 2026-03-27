import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, MapPin, BellRing } from 'lucide-react';
import api from '../../../services/axios';
import { logError } from '../../../utils/errorHandler';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

// ─── Toast Notification ───────────────────────────────────────────────────────

const SuccessToast = ({ visible }) => (
  <div
    className={`fixed top-4 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3.5 bg-dark text-white rounded-2xl shadow-xl transition-all duration-500 max-w-sm mx-auto ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
    }`}
  >
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
      <CheckCircle size={16} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold">You're on the waitlist!</p>
      <p className="text-xs text-white/70">We'll notify you when we launch in your area.</p>
    </div>
  </div>
);

// ─── Illustration ─────────────────────────────────────────────────────────────

const NoVendorsIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-44 h-44 mx-auto" fill="none">
    {/* Shadow */}
    <ellipse cx="100" cy="150" rx="52" ry="7" fill="#E8F5E9" opacity="0.8" />

    {/* City buildings */}
    <rect x="30" y="90" width="22" height="50" rx="3" fill="#C8E6C9" opacity="0.5" />
    <rect x="35" y="98" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />
    <rect x="43" y="98" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />
    <rect x="35" y="108" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />
    <rect x="43" y="108" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />

    <rect x="56" y="75" width="28" height="65" rx="3" fill="#B2DFDB" opacity="0.5" />
    <rect x="62" y="83" width="6" height="6" rx="1" fill="#80CBC4" opacity="0.6" />
    <rect x="71" y="83" width="6" height="6" rx="1" fill="#80CBC4" opacity="0.6" />
    <rect x="62" y="95" width="6" height="6" rx="1" fill="#80CBC4" opacity="0.6" />
    <rect x="71" y="95" width="6" height="6" rx="1" fill="#80CBC4" opacity="0.6" />
    <rect x="62" y="107" width="6" height="6" rx="1" fill="#80CBC4" opacity="0.6" />
    <rect x="71" y="107" width="6" height="6" rx="1" fill="#80CBC4" opacity="0.6" />

    <rect x="148" y="85" width="22" height="55" rx="3" fill="#C8E6C9" opacity="0.5" />
    <rect x="153" y="93" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />
    <rect x="161" y="93" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />
    <rect x="153" y="103" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />
    <rect x="161" y="103" width="5" height="5" rx="1" fill="#A5D6A7" opacity="0.6" />

    <rect x="118" y="70" width="26" height="70" rx="3" fill="#DCEDC8" opacity="0.5" />
    <rect x="123" y="78" width="6" height="6" rx="1" fill="#AED581" opacity="0.6" />
    <rect x="132" y="78" width="6" height="6" rx="1" fill="#AED581" opacity="0.6" />
    <rect x="123" y="90" width="6" height="6" rx="1" fill="#AED581" opacity="0.6" />
    <rect x="132" y="90" width="6" height="6" rx="1" fill="#AED581" opacity="0.6" />
    <rect x="123" y="102" width="6" height="6" rx="1" fill="#AED581" opacity="0.6" />
    <rect x="132" y="102" width="6" height="6" rx="1" fill="#AED581" opacity="0.6" />

    {/* Map pin */}
    <path d="M100 18 C112 18 122 28 122 42 C122 60 100 82 100 82 C100 82 78 60 78 42 C78 28 88 18 100 18 Z" fill="#E8F5E9" stroke="#1a4731" strokeWidth="2.5" />
    <circle cx="100" cy="42" r="8" fill="#1a4731" />
    <circle cx="100" cy="42" r="3.5" fill="white" />

    {/* Dashed search radius circle */}
    <circle cx="100" cy="42" r="32" stroke="#1a4731" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.25" />

    {/* Question marks / dots indicating no vendors */}
    <circle cx="68" cy="50" r="4" fill="#E8F5E9" stroke="#1a4731" strokeWidth="1.5" opacity="0.5" />
    <circle cx="132" cy="55" r="4" fill="#E8F5E9" stroke="#1a4731" strokeWidth="1.5" opacity="0.5" />
    <circle cx="100" cy="18" r="3" fill="#E8F5E9" stroke="#1a4731" strokeWidth="1.5" opacity="0.3" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const NoVendorsEmptyState = ({ latitude, longitude, address }) => {
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  // Animate toast in then out
  useEffect(() => {
    if (showToast) {
      // Slight delay before showing so transition fires
      requestAnimationFrame(() => setToastVisible(true));

      // Start fade out at 4.5s, hide at 5s
      const fadeTimer = setTimeout(() => setToastVisible(false), 4500);
      const hideTimer = setTimeout(() => setShowToast(false), 5000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [showToast]);

  const handleJoinWaitlist = async () => {
    try {
      setIsJoiningWaitlist(true);

      await api.post(API_ENDPOINTS.WAITLIST.LIST, {
        latitude,
        longitude,
        address: address || 'Unknown',
      });

      setShowToast(true);
    } catch (err) {
      logError(err, { context: 'NoVendorsEmptyState.handleJoinWaitlist' });
      alert('Failed to join waitlist. Please try again.');
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {showToast && <SuccessToast visible={toastVisible} />}

      {/* Empty State */}
      <div className="flex flex-col items-center text-center py-12 px-6">
        <NoVendorsIllustration />

        <div className="mt-6 mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <MapPin size={12} />
            {address ? address.split(',')[0] : 'Your area'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-dark mt-3 mb-2">
          Not in your area yet
        </h3>
        <p className="text-sm text-muted mb-8 max-w-xs leading-relaxed">
          We haven't launched in your area yet but we're growing fast. Join the waitlist and we'll let you know the moment we arrive.
        </p>

        <button
          onClick={handleJoinWaitlist}
          disabled={isJoiningWaitlist}
          className="w-full max-w-xs flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all text-sm"
        >
          {isJoiningWaitlist ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <BellRing size={16} />
              Notify me when you're here
            </>
          )}
        </button>

        <p className="text-xs text-muted mt-4">
          No spam. Just one email when we launch near you.
        </p>
      </div>
    </>
  );
};

export default NoVendorsEmptyState;