import { Building2, Phone } from 'lucide-react';
import { useState } from 'react';
import OptionSelect from '../../../../components/ui/OptionSelect';
import { SellerFormField, SellerPrimaryButton, SellerTextInput } from '../../components/ui/SellerPrimitives';

const BUSINESS_TYPE_OPTIONS = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'student_vendor', label: 'Student Vendor' },
];

const StoreDetailsForm = ({ storeData, loading, onSave }) => {
  const [formData, setFormData] = useState({
    publicName: storeData?.publicName || '',
    description: storeData?.description || '',
    businessType: storeData?.businessType || 'student_vendor',
    phone: storeData?.phone || '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.publicName.trim()) nextErrors.publicName = 'Store name is required.';
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required.';
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
      publicName: formData.publicName.trim(),
      description: formData.description.trim(),
      businessType: formData.businessType,
      phone: formData.phone.trim(),
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>

        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Store name</label>
        <input
          type="text"
          name="publicName"
          value={formData.publicName}
          onChange={handleInputChange}
          placeholder="Your store name"
          className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.publicName ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
        />
        {errors.publicName ? <p className="mt-1 text-xs font-medium text-red-600">{errors.publicName}</p> : null}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Business type</label>
        <OptionSelect
          value={formData.businessType}
          onChange={(value) => {
            setFormData((current) => ({ ...current, businessType: value }));
            if (errors.businessType) {
              setErrors((current) => ({ ...current, businessType: undefined }));
            }
          }}
          placeholder="Select business type"
          options={BUSINESS_TYPE_OPTIONS}
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Phone number</label>
        <div className="relative mt-1">
          <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+234..."
            className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pl-11 text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.phone ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
          />
        </div>
        {errors.phone ? <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p> : null}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Tell customers about your store..."
          rows={5}
          className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none ${errors.description ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
        />
        {errors.description ? <p className="mt-1 text-xs font-medium text-red-600">{errors.description}</p> : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
      >
        {loading ? 'Saving...' : 'Save store details'}
      </button>
    </form>
  );
};

export default StoreDetailsForm;
