import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

const LoginPromptModal = ({ isOpen, onClose, title, message, redirectAfterLogin = null }) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const [displayMessage, setDisplayMessage] = useState(message);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setDisplayMessage(message);
  }, [message]);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      // tiny delay so CSS transition fires
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogin = () => {
    onClose();
    navigate(redirectAfterLogin
      ? `/login?next=${encodeURIComponent(redirectAfterLogin)}`
      : '/login'
    );
  };

  const handleRegister = () => {
    onClose();
    navigate(redirectAfterLogin
      ? `/signup?next=${encodeURIComponent(redirectAfterLogin)}`
      : '/signup'
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Sheet / Modal wrapper */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div
          ref={modalRef}
          className="bg-surface w-full md:max-w-sm md:mx-4 md:rounded-3xl rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out overflow-hidden"
          style={{
            transform: visible
              ? 'translateY(0)'
              : 'translateY(100%)',
          }}
        >

          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Close button row */}
          <div className="flex justify-end px-4 pt-2 md:pt-4">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={16} className="text-dark" />
            </button>
          </div>

          {/* Icon + Title */}
          <div className="flex flex-col items-center px-6 pt-2 pb-5 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-dark mb-2">
              {title || 'Login Required'}
            </h2>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              {displayMessage}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="px-5 pb-3 space-y-3">
            {/* Login — primary */}
            <button
              onClick={handleLogin}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <LogIn size={18} />
              Login to your account
            </button>

            {/* Register — outlined */}
            <button
              onClick={handleRegister}
              className="w-full border-2 border-primary text-primary font-bold py-4 rounded-2xl hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <UserPlus size={18} />
              Create an account
            </button>
          </div>

          {/* Continue as Guest */}
          <div className="px-5 pt-1 pb-8 md:pb-6">
            <button
              onClick={onClose}
              className="w-full py-3 text-sm text-muted font-semibold hover:text-dark transition-colors"
            >
              Continue as guest
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default LoginPromptModal;