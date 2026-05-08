import { MapPin } from 'lucide-react';
import { SellerPrimaryButton } from '../../components/ui/SellerPrimitives';

const StoreLocationForm = ({ storeData, onLocationSelect, loading }) => {
  const handleLocationClick = () => {
    onLocationSelect();
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-4 py-4 ${storeData?.address ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${storeData?.address ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-dark">{storeData?.address || 'No location selected yet'}</p>
            <p className="mt-1 text-sm text-muted">
              Coordinates: {(Number(storeData?.latitude) || 0).toFixed(6)}, {(Number(storeData?.longitude) || 0).toFixed(6)}
            </p>
          </div>
        </div>
      </div>

      <SellerPrimaryButton
        onClick={handleLocationClick}
        disabled={loading}
        icon={<MapPin size={16} />}
        className="sm:w-auto sm:px-5"
      >
        {storeData?.address ? 'Change Location' : 'Select Location'}
      </SellerPrimaryButton>
    </div>
  );
};

export default StoreLocationForm;
