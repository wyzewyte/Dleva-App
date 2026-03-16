import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  SETTINGS_VALIDATION,
  SETTINGS_ERRORS,
  SETTINGS_LABELS,
} from '../../constants/settingsConstants';

const VehicleInfo = ({ profile, onSave, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type: profile?.vehicle_type || '',
    vehicle_plate_number: profile?.vehicle_plate_number || '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicle_type) {
      newErrors.vehicle_type = SETTINGS_ERRORS.VEHICLE_TYPE_REQUIRED;
    }

    if (!formData.vehicle_plate_number.trim()) {
      newErrors.vehicle_plate_number = SETTINGS_ERRORS.PLATE_REQUIRED;
    } else if (
      formData.vehicle_plate_number.length < SETTINGS_VALIDATION.PLATE_MIN ||
      formData.vehicle_plate_number.length > SETTINGS_VALIDATION.PLATE_MAX
    ) {
      newErrors.vehicle_plate_number = SETTINGS_ERRORS.INVALID_PLATE;
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
        vehicle_type: formData.vehicle_type,
        vehicle_plate_number: formData.vehicle_plate_number.trim().toUpperCase(),
      };
      await onSave(dataToSend);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      vehicle_type: profile?.vehicle_type || '',
      vehicle_plate_number: profile?.vehicle_plate_number || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{SETTINGS_LABELS.VEHICLE_INFO}</h3>
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
          {/* Vehicle Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {SETTINGS_LABELS.VEHICLE_TYPE}
            </label>
            <select
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.vehicle_type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{SETTINGS_LABELS.SELECT_VEHICLE}</option>
              {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                <option key={value} value={value}>
                  {VEHICLE_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
            {errors.vehicle_type && (
              <p className="mt-1 text-sm text-red-600">{errors.vehicle_type}</p>
            )}
          </div>

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {SETTINGS_LABELS.LICENSE_PLATE}
            </label>
            <input
              type="text"
              name="vehicle_plate_number"
              value={formData.vehicle_plate_number}
              onChange={handleInputChange}
              placeholder={SETTINGS_LABELS.PLATE_EXAMPLE}
              className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.vehicle_plate_number ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.vehicle_plate_number && (
              <p className="mt-1 text-sm text-red-600">{errors.vehicle_plate_number}</p>
            )}
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
            <label className="text-sm text-gray-600">{SETTINGS_LABELS.VEHICLE_TYPE}</label>
            <p className="text-gray-900 font-medium">
              {formData.vehicle_type ? VEHICLE_TYPE_LABELS[formData.vehicle_type] : '-'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">{SETTINGS_LABELS.LICENSE_PLATE}</label>
            <p className="text-gray-900 font-mono font-medium">
              {profile?.vehicle_plate_number || '-'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleInfo;
