import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import buyerProfile from '../../../services/buyerProfile';
import { validatePassword } from '../../../utils/validators';
import { getMessage } from '../../../constants/messages';
import {
  BuyerAuthPanel,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPrimaryButton,
  BuyerSecondaryButton,
  BuyerTextInput,
} from '../components/ui/BuyerPrimitives';

const PasswordField = ({ label, value, onChange, visible, onToggle, icon: Icon }) => (
  <BuyerFormField label={label}>
    <div className="relative">
      <BuyerTextInput
        icon={Icon}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        className="pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </BuyerFormField>
);

const ChangePasswordModern = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/profile'), 1200);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await buyerProfile.changePassword(oldPassword, newPassword);
      setSuccess(getMessage('PASSWORD_CHANGED'));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || getMessage('PASSWORD_CHANGE_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BuyerAuthPanel
      title="Change Password"
      icon={<KeyRound size={24} />}
      footer={
        <button type="button" onClick={() => navigate('/profile')} className="font-semibold text-primary">
          Back to profile
        </button>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <BuyerFeedbackState type="error" title="Could not update password" message={error} /> : null}
        {success ? <BuyerFeedbackState type="success" title="Password updated" message={success} /> : null}

        <PasswordField label="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} visible={showOld} onToggle={() => setShowOld((prev) => !prev)} icon={Lock} />
        <PasswordField label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} visible={showNew} onToggle={() => setShowNew((prev) => !prev)} icon={KeyRound} />
        <PasswordField label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} visible={showConfirm} onToggle={() => setShowConfirm((prev) => !prev)} icon={KeyRound} />

        <div className="flex flex-col gap-3 pt-2">
          <BuyerPrimaryButton type="submit" loading={loading}>
            Update Password
          </BuyerPrimaryButton>
          <BuyerSecondaryButton type="button" onClick={() => navigate('/profile')}>
            Cancel
          </BuyerSecondaryButton>
        </div>
      </form>
    </BuyerAuthPanel>
  );
};

export default ChangePasswordModern;
