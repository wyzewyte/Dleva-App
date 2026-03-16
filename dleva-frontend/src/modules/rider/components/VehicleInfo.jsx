/**
 * VehicleInfo Component
 * Handles vehicle type and plate number management
 */

import { useState } from 'react';
import { Loader2, Truck } from 'lucide-react';
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  SETTINGS_VALIDATION,
  SETTINGS_ERRORS,
} from '../constants/settingsConstants';

const VehicleInfo = ({ profile, onSave, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type: profile?.vehicle_type || VEHICLE_TYPES.BIKE,
    vehicle_plate_number: profile?.vehicle_plate_number || '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!Object.values(VEHICLE_TYPES).includes(formData.vehicle_type)) {
      newErrors.vehicle_type = SETTINGS_ERRORS.INVALID_VEHICLE_TYPE;
    }

    if (
      formData.vehicle_plate_number.length < SETTINGS_VALIDATION.PLATE_NUMBER_MIN ||
      formData.vehicle_plate_number.length > SETTINGS_VALIDATION.PLATE_NUMBER_MAX
    ) {
      newErrors.vehicle_plate_number = SETTINGS_ERRORS.INVALID_PLATE_NUMBER;
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
        <div className="flex items-center gap-3">
          <Truck size={22} className="text-primary" />
          <h3 className="font-bold text-dark text-lg">Vehicle Information</h3>
        </div>
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
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs font-bold text-muted uppercase mb-1">Vehicle Type</p>
              <p className="text-lg font-bold text-dark">
                {VEHICLE_TYPE_LABELS[profile?.vehicle_type] || 'Not set'}
              </p>
            </div>

            <div className="h-px bg-primary/10" />

            <div>
              <p className="text-xs font-bold text-muted uppercase mb-1">Plate Number</p>
              <p className="text-lg font-bold text-dark font-mono">
                {profile?.vehicle_plate_number || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Vehicle Type *
            </label>
            <select
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.vehicle_type ? 'border-red-300 focus:ring-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Select a vehicle type</option>
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.vehicle_type && (
              <p className="text-xs text-red-600 mt-1">{errors.vehicle_type}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Plate Number *
            </label>
            <input
              type="text"
              name="vehicle_plate_number"
              value={formData.vehicle_plate_number}
              onChange={handleChange}
              placeholder="e.g., ABC-1234 XYZ"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono ${
                errors.vehicle_plate_number
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-gray-200'
              }`}
            />
            {errors.vehicle_plate_number && (
              <p className="text-xs text-red-600 mt-1">{errors.vehicle_plate_number}</p>
            )}
            <p className="text-xs text-muted mt-1">Include all characters as they appear</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  vehicle_type: profile?.vehicle_type || VEHICLE_TYPES.BIKE,
                  vehicle_plate_number: profile?.vehicle_plate_number || '',
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
              {loading ? 'Saving...' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VehicleInfo;
