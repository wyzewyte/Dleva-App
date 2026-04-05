import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import PhoneVerification from './PhoneVerification';

const digits = (value) => String(value || '').replace(/\D/g, '');

const ProfileForm = ({ profile, onSave, onPhoneVerified, loading }) => {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || profile?.user?.username || '',
    phone_number: profile?.phone_number || '',
    email: profile?.email || '',
  });
  const [errors, setErrors] = useState({});
  const [verifiedPhone, setVerifiedPhone] = useState(profile?.phone_verified ? profile?.phone_number || '' : '');

  const isPhoneVerified = Boolean(profile?.phone_verified) && digits(formData.phone_number) === digits(verifiedPhone);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.full_name.trim()) nextErrors.full_name = 'Full name is required.';
    if (!formData.username.trim()) nextErrors.username = 'Username is required.';
    if (!formData.phone_number.trim()) nextErrors.phone_number = 'Phone number is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    await onSave({
      full_name: formData.full_name.trim(),
      username: formData.username.trim(),
    });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <h4 className="text-lg font-bold text-dark">Profile details</h4>
          <p className="mt-1 text-sm text-muted">Update your name, username, and phone details here. Email stays locked.</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="yourusername"
            className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.username ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
          />
          {errors.username ? <p className="mt-1 text-xs font-medium text-red-600">{errors.username}</p> : null}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Full name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            placeholder="Your full name"
            className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.full_name ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
          />
          {errors.full_name ? <p className="mt-1 text-xs font-medium text-red-600">{errors.full_name}</p> : null}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Phone number</label>
          <div className="relative mt-1">
            <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="+234..."
              className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pl-11 text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.phone_number ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
            />
          </div>
          {errors.phone_number ? <p className="mt-1 text-xs font-medium text-red-600">{errors.phone_number}</p> : null}
          <p className={`mt-1 text-xs font-medium ${isPhoneVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isPhoneVerified ? 'This phone number is verified.' : 'Verify this phone number below if you changed it.'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Email</label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 pl-11 text-sm text-gray-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
        >
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <PhoneVerification
        phone={formData.phone_number}
        verifiedPhone={verifiedPhone}
        phoneVerified={isPhoneVerified}
        onVerified={async (phone) => {
          setVerifiedPhone(phone);
          await onPhoneVerified?.(phone);
        }}
      />
    </div>
  );
};

export default ProfileForm;
