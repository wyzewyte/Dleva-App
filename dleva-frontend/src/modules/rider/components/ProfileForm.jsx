/**
 * ProfileForm Component
 * Handles basic profile information editing (name, phone, email)
 */

import { useState } from 'react';
import { Mail, Phone, User, Loader2 } from 'lucide-react';
import { SETTINGS_VALIDATION, SETTINGS_ERRORS } from '../constants/settingsConstants';

const ProfileForm = ({ profile, onSave, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    email: profile?.user?.email || '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (formData.full_name.length < SETTINGS_VALIDATION.NAME_MIN) {
      newErrors.full_name = SETTINGS_ERRORS.INVALID_NAME;
    }

    if (formData.phone_number.length < SETTINGS_VALIDATION.PHONE_MIN) {
      newErrors.phone_number = SETTINGS_ERRORS.INVALID_PHONE;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    await onSave(formData);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 space-y-4 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-dark text-lg">Basic Information</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-bold text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        // View Mode
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User size={18} className="text-muted" />
            <div className="flex-1">
              <p className="text-xs font-bold text-muted uppercase">Name</p>
              <p className="text-dark font-bold">{profile?.full_name || 'Not set'}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex items-center gap-3">
            <Phone size={18} className="text-muted" />
            <div className="flex-1">
              <p className="text-xs font-bold text-muted uppercase">Phone</p>
              <p className="text-dark font-bold">{profile?.phone_number || 'Not set'}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex items-center gap-3">
            <Mail size={18} className="text-muted" />
            <div className="flex-1">
              <p className="text-xs font-bold text-muted uppercase">Email</p>
              <p className="text-dark font-bold">{profile?.user?.email || 'Not set'}</p>
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.full_name ? 'border-red-300 focus:ring-red-300' : 'border-gray-200'
              }`}
            />
            {errors.full_name && (
              <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.phone_number ? 'border-red-300 focus:ring-red-300' : 'border-gray-200'
              }`}
            />
            {errors.phone_number && (
              <p className="text-xs text-red-600 mt-1">{errors.phone_number}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-muted mt-1">Email cannot be changed</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  full_name: profile?.full_name || '',
                  phone_number: profile?.phone_number || '',
                  email: profile?.user?.email || '',
                });
                setErrors({});
              }}
              className="flex-1 px-4 py-2 border-2 border-gray-200 text-dark font-bold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileForm;
