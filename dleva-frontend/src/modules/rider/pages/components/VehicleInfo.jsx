import { useState } from 'react';
import SettingsOptionSelect from './SettingsOptionSelect';

const VEHICLE_OPTIONS = [
  { value: 'bike', label: 'Bike' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'car', label: 'Car' },
];

const VehicleInfo = ({ profile, onSave, loading }) => {
  const [formData, setFormData] = useState({
    vehicle_type: profile?.vehicle_type || 'bike',
    vehicle_plate_number: profile?.vehicle_plate_number || '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.vehicle_type) nextErrors.vehicle_type = 'Vehicle type is required.';
    if (!formData.vehicle_plate_number.trim()) nextErrors.vehicle_plate_number = 'Plate number is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'vehicle_plate_number' ? value.toUpperCase() : value,
    }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    await onSave({
      vehicle_type: formData.vehicle_type,
      vehicle_plate_number: formData.vehicle_plate_number.trim().toUpperCase(),
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <h4 className="text-lg font-bold text-dark">Vehicle details</h4>
        <p className="mt-1 text-sm text-muted">Keep your active delivery vehicle details accurate and easy to review.</p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Vehicle type</label>
        <SettingsOptionSelect
          value={formData.vehicle_type}
          options={VEHICLE_OPTIONS}
          onChange={(value) => handleInputChange({ target: { name: 'vehicle_type', value } })}
          error={Boolean(errors.vehicle_type)}
          placeholder="Select vehicle type"
        />
        {errors.vehicle_type ? <p className="mt-1 text-xs font-medium text-red-600">{errors.vehicle_type}</p> : null}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Plate number</label>
        <input
          type="text"
          name="vehicle_plate_number"
          value={formData.vehicle_plate_number}
          onChange={handleInputChange}
          placeholder="ABC-1234"
          className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-3 font-mono text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.vehicle_plate_number ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
        />
        {errors.vehicle_plate_number ? <p className="mt-1 text-xs font-medium text-red-600">{errors.vehicle_plate_number}</p> : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
      >
        {loading ? 'Saving...' : 'Save vehicle'}
      </button>
    </form>
  );
};

export default VehicleInfo;
