import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sellerSettings from '../../../../services/sellerSettings';
import toast from '../../../../services/toast';
import SellerLocationSearchModal from '../../components/SellerLocationSearchModal';

const SellerLocationSetup = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const handleLocationSelected = async (location) => {
    setIsSaving(true);

    try {
      const restaurantData = new FormData();
      restaurantData.append('address', location.address);
      restaurantData.append('latitude', location.latitude);
      restaurantData.append('longitude', location.longitude);

      const profileData = new FormData();
      profileData.append('address', location.address);
      profileData.append('latitude', location.latitude);
      profileData.append('longitude', location.longitude);

      await Promise.all([
        sellerSettings.updateRestaurant(restaurantData),
        sellerSettings.updateProfile(profileData),
      ]);

      toast.success('Store location saved.');
      navigate('/seller/dashboard', { replace: true });
      return true;
    } catch (saveError) {
      toast.error(saveError?.error || 'Unable to save store location right now.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SellerLocationSearchModal
      isOpen
      isModal={false}
      onClose={() => navigate('/seller/dashboard', { replace: true })}
      onLocationSelected={handleLocationSelected}
      confirmLabel={isSaving ? 'Saving...' : 'Start Selling Food'}
    />
  );
};

export default SellerLocationSetup;
