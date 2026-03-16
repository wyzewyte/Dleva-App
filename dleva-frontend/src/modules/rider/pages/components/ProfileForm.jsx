import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { SETTINGS_VALIDATION, SETTINGS_ERRORS, SETTINGS_SUCCESS, SETTINGS_LABELS } from '../../constants/settingsConstants';

const ProfileForm = ({ profile, onSave, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    email: profile?.email || '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.full_name.trim()) {
      newErrors.full_name = SETTINGS_ERRORS.NAME_REQUIRED;
    } else if (
      formData.full_name.length < SETTINGS_VALIDATION.NAME_MIN ||
      formData.full_name.length > SETTINGS_VALIDATION.NAME_MAX
    ) {
      newErrors.full_name = SETTINGS_ERRORS.INVALID_NAME;
    }

    // Validate phone
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = SETTINGS_ERRORS.PHONE_REQUIRED;
    } else if (formData.phone_number.replace(/\D/g, '').length < SETTINGS_VALIDATION.PHONE_MIN) {
      newErrors.phone_number = SETTINGS_ERRORS.INVALID_PHONE;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSave = async () => {
    if (validateForm()) {
      const dataToSend = {
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
      };
      await onSave(dataToSend);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      email: profile?.email || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{SETTINGS_LABELS.BASIC_INFO}</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-primary transition-colors"
          >
            <Edit2 size={18} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {SETTINGS_LABELS.FULL_NAME}
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {SETTINGS_LABELS.PHONE_NUMBER}
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.phone_number ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
            )}
          </div>

          {/* Email Field (Always Disabled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {SETTINGS_LABELS.EMAIL}
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">{SETTINGS_LABELS.EMAIL_INFO}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {loading ? SETTINGS_LABELS.SAVING : SETTINGS_LABELS.SAVE_CHANGES}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} />
              {SETTINGS_LABELS.CANCEL}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">{SETTINGS_LABELS.FULL_NAME}</label>
            <p className="text-gray-900 font-medium">{profile?.full_name || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">{SETTINGS_LABELS.PHONE_NUMBER}</label>
            <p className="text-gray-900 font-medium">{profile?.phone_number || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">{SETTINGS_LABELS.EMAIL}</label>
            <p className="text-gray-900 font-medium">{profile?.email || '-'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;
