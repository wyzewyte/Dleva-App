import { useEffect, useRef, useState } from 'react';
import { Camera, HelpCircle, Lock, LogOut, Mail, MapPin, Phone, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import buyerProfile from '../../../services/buyerProfile';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import { logError } from '../../../utils/errorHandler';
import {
  BuyerCard,
  BuyerFeedbackState,
  BuyerFormField,
  BuyerPageHeader,
  BuyerPrimaryButton,
  BuyerSecondaryButton,
  BuyerTextInput,
} from '../components/ui/BuyerPrimitives';

const ProfileModern = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(!user);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    image: null,
    imagePreview: null,
  });

  useEffect(() => {
    if (!user) return;
    setProfile(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      image: null,
      imagePreview: user.image || null,
    });
    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };

      if (formData.image instanceof File) payload.image = formData.image;

      const updatedProfile = await buyerProfile.updateProfile(payload);
      setProfile(updatedProfile);
      setUser(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      logError(err, { context: 'ProfileModern.handleSave' });
      setError(err.error || 'Failed to update your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (event) => {
    if (!event.target.files?.[0]) return;
    const file = event.target.files[0];
    setFormData((previous) => ({
      ...previous,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  if (loading) {
    return (
      <BuyerFeedbackState
        type="loading"
        title="Loading your profile"
        message="Pulling in your details and preferences."
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BuyerPageHeader
        title="Profile"
      />

      {error && (
        <BuyerFeedbackState
          type="error"
          title="Could not update profile"
          message={error}
        />
      )}

      <BuyerCard className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <img
              src={formData.imagePreview || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="h-24 w-24 rounded-[20px] object-cover shadow-sm"
            />
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm"
                >
                  <Camera size={16} />
                </button>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Buyer Account</p>
            <h2 className="mt-1 text-2xl font-bold text-dark">{profile?.name || 'Your profile'}</h2>
            <p className="mt-1 text-sm text-muted">{profile?.email || 'No email added yet'}</p>
          </div>

          {!isEditing ? (
            <div className="w-full sm:w-auto">
              <BuyerPrimaryButton onClick={() => setIsEditing(true)}>
                Edit Profile
              </BuyerPrimaryButton>
            </div>
          ) : null}
        </div>
      </BuyerCard>

      <BuyerCard className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <BuyerFormField label="Full Name">
            {isEditing ? (
              <BuyerTextInput icon={User} value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-dark">{profile?.name || 'Not set'}</p>
            )}
          </BuyerFormField>

          <BuyerFormField label="Email">
            {isEditing ? (
              <BuyerTextInput icon={Mail} type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-dark">{profile?.email || 'Not set'}</p>
            )}
          </BuyerFormField>

          <BuyerFormField label="Phone">
            {isEditing ? (
              <BuyerTextInput icon={Phone} type="tel" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-dark">{profile?.phone || 'Not set'}</p>
            )}
          </BuyerFormField>

          <BuyerFormField label="Delivery Address">
            {isEditing ? (
              <BuyerTextInput icon={MapPin} value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} />
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-dark">{profile?.address || 'Not set'}</p>
            )}
          </BuyerFormField>
        </div>

        {isEditing ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <BuyerPrimaryButton onClick={handleSave} loading={isSaving}>
              Save Changes
            </BuyerPrimaryButton>
            <BuyerSecondaryButton onClick={() => setIsEditing(false)}>
              Cancel
            </BuyerSecondaryButton>
          </div>
        ) : null}
      </BuyerCard>

      <BuyerCard className="overflow-hidden">
        {[
          { label: 'Order History', hint: 'View your past orders', icon: User, action: () => navigate('/history') },
          { label: 'Help & Support', hint: 'Get help or contact support', icon: HelpCircle, action: () => navigate('/support') },
          { label: 'Change Password', hint: 'Keep your account secure', icon: Lock, action: () => navigate('/change-password') },
        ].map((item, index) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${index !== 2 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-dark">{item.label}</p>
              <p className="text-xs text-muted">{item.hint}</p>
            </div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.replace('/home');
          }}
          className="flex w-full items-center gap-3 px-5 py-4 text-left text-red-600 transition-colors hover:bg-red-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <LogOut size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Logout</p>
            <p className="text-xs text-red-500/80">Sign out of your buyer account</p>
          </div>
        </button>
      </BuyerCard>
    </div>
  );
};

export default ProfileModern;
