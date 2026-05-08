import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ChevronRight, CreditCard, Loader2, LogOut, MapPin, MessageSquare, Pencil, Shield, Store, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sellerSettings from '../../../services/sellerSettings';
import { logError } from '../../../utils/errorHandler';
import cloudinaryUpload from '../../../services/cloudinaryUpload';
import SellerLocationSearchModal from '../components/SellerLocationSearchModal';
import SellerPageLoading from '../components/ui/SellerPageLoading';
import {
  SellerCard,
  SellerFeedbackState,
  SellerPageHeader,
  SellerPrimaryButton,
  SellerSecondaryButton,
  SellerStatusBadge,
} from '../components/ui/SellerPrimitives';
import StoreDetailsForm from './components/StoreDetailsForm';
import StoreLocationForm from './components/StoreLocationForm';
import PayoutDetailsForm from './components/PayoutDetailsForm';
import { SellerReviewsContent } from './Reviews';

const initials = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S';

const SettingsModal = ({ open, title, subtitle, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full w-full flex-col">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-dark sm:text-2xl">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-dark transition-colors hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </div>
      </div>
    </div>
  );
};

const SettingsRow = ({ icon, title, subtitle, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 border-b border-gray-100 px-1 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50/70"
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-50 text-primary">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-base font-semibold text-dark">{title}</p>
      {subtitle ? <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted">{subtitle}</p> : null}
    </div>
    {badge ? (
      <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        {badge}
      </div>
    ) : null}
    <ChevronRight size={18} className="shrink-0 text-muted" />
  </button>
);

const SellerSettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [busyKey, setBusyKey] = useState('');
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);

  const [storeData, setStoreData] = useState({
    publicName: '',
    description: '',
    businessType: 'student_vendor',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0,
    image: null,
    imagePreview: null,
    cloudinary_image_id: '',
    cloudinary_image_url: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const [payoutData, setPayoutData] = useState({
    bank_code: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    verified: false,
  });

  const isBusy = (key) => busyKey === key;
  const closeModal = () => setActiveModal(null);

  const loadSettings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { profile, restaurant } = await sellerSettings.getSettings();
      setStoreData({
        publicName: restaurant.name || '',
        description: restaurant.description || '',
        businessType: profile.business_type || 'student_vendor',
        phone: profile.phone || '',
        address: restaurant.address || profile.address || '',
        latitude: parseFloat(restaurant.latitude) || parseFloat(profile.latitude) || 0,
        longitude: parseFloat(restaurant.longitude) || parseFloat(profile.longitude) || 0,
        image: null,
        imagePreview: restaurant.cloudinary_image_url || restaurant.image ? `http://127.0.0.1:8000${restaurant.image}` : null,
        cloudinary_image_id: restaurant.cloudinary_image_id || '',
        cloudinary_image_url: restaurant.cloudinary_image_url || '',
      });

      const payoutDetails = await sellerSettings.getPayoutDetails();
      if (payoutDetails) {
        setPayoutData({
          bank_code: payoutDetails.bank_code || '',
          bankName: payoutDetails.bank_name || '',
          accountNumber: payoutDetails.account_number || '',
          accountName: payoutDetails.account_name || '',
          verified: payoutDetails.verified || false,
        });
      }
    } catch (loadError) {
      setError(loadError?.error || loadError?.message || 'Unable to load seller settings right now.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings().catch(() => {});
  }, [loadSettings]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = cloudinaryUpload.validateFile(file);
    if (!validation.valid) {
      setImageError(validation.error);
      return;
    }

    setBusyKey('photo');
    setImageError('');
    try {
      // Upload to Cloudinary
      const uploadResult = await cloudinaryUpload.uploadRestaurantImage(file);
      
      // Update store data with cloudinary info
      setStoreData(prev => ({
        ...prev,
        image: null,
        imagePreview: uploadResult.url,
        cloudinary_image_id: uploadResult.public_id,
        cloudinary_image_url: uploadResult.url
      }));

      // Save to database
      const formData = new FormData();
      formData.append('cloudinary_image_id', uploadResult.public_id);
      formData.append('cloudinary_image_url', uploadResult.url);
      await sellerSettings.updateRestaurant(formData);
      
      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Store photo updated.' });
    } catch (saveError) {
      setImageError(saveError?.error || 'Failed to upload photo');
      setNotice({ type: 'error', message: saveError?.error || 'Unable to update store photo right now.' });
    } finally {
      event.target.value = '';
      setBusyKey('');
    }
  };

  const handleSaveStoreDetails = async (data) => {
    setBusyKey('store-details');
    try {
      // Update restaurant name and description
      const restaurantFormData = new FormData();
      restaurantFormData.append('name', data.publicName);
      restaurantFormData.append('description', data.description);

      // Update profile with business_type and phone (send as JSON for better handling)
      const profileData = {
        phone: data.phone,
        business_type: data.businessType,
      };

      await Promise.all([
        sellerSettings.updateRestaurant(restaurantFormData),
        sellerSettings.updateProfile(profileData), // Send JSON object instead of FormData
      ]);

      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Store details updated.' });
      closeModal();
      return true;
    } catch (saveError) {
      console.error('Store details save error:', saveError); // Debug logging
      setNotice({ type: 'error', message: saveError?.error || 'Unable to update store details right now.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const handleSaveLocation = async (location) => {
    setBusyKey('location');
    try {
      const restaurantFormData = new FormData();
      restaurantFormData.append('name', storeData.publicName);
      restaurantFormData.append('description', storeData.description);
      restaurantFormData.append('address', location.address);
      restaurantFormData.append('latitude', location.latitude);
      restaurantFormData.append('longitude', location.longitude);

      const profileFormData = new FormData();
      profileFormData.append('phone', storeData.phone);
      profileFormData.append('address', location.address);
      profileFormData.append('latitude', location.latitude);
      profileFormData.append('longitude', location.longitude);
      profileFormData.append('business_type', storeData.businessType);

      await Promise.all([
        sellerSettings.updateRestaurant(restaurantFormData),
        sellerSettings.updateProfile(profileFormData),
      ]);

      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Store location updated.' });
      setIsLocationSearchOpen(false);
      closeModal();
      return true;
    } catch (saveError) {
      setNotice({ type: 'error', message: saveError?.error || 'Unable to update store location right now.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const handleSavePayout = async (data) => {
    setBusyKey('payout');
    try {
      await sellerSettings.updatePayoutDetails({
        bank_code: data.bankCode,
        bank_name: data.bankName,
        account_number: data.accountNumber,
        account_name: data.accountName,
      });
      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Payout details updated.' });
      closeModal();
      return true;
    } catch (saveError) {
      setNotice({ type: 'error', message: saveError?.error || 'Unable to update payout details right now.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  if (loading) {
    return <SellerPageLoading variant="settings" />;
  }

  if (error) {
    return (
      <div className="space-y-6 py-6">
        <SellerPageHeader title="Settings" />
        <SellerFeedbackState
          type="error"
          title="Unable to load settings"
          message={error}
          action={<SellerPrimaryButton onClick={() => loadSettings()}>Try again</SellerPrimaryButton>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <SellerPageHeader title="Settings" sticky />

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            notice.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      {/* Store Header Card */}
      <SellerCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] bg-dark text-2xl font-bold text-white">
              {storeData.imagePreview ? (
                <img src={storeData.imagePreview} alt={storeData.publicName || 'Store'} className="h-full w-full object-cover" />
              ) : (
                initials(storeData.publicName)
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white bg-primary text-white shadow-lg transition-transform hover:scale-110"
              disabled={isBusy('photo')}
            >
              {isBusy('photo') ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-dark">{storeData.publicName || 'Your Store'}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SellerStatusBadge status="active">Active</SellerStatusBadge>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-dark">
              {storeData.businessType === 'restaurant' ? 'Restaurant' : 'Student Vendor'}
              </span>
            </div>
          </div>
        </div>
      </SellerCard>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Store Information Section */}
        <section>
          <div className="mb-3 px-1">
            <h3 className="text-xl font-bold text-dark">Store Information</h3>
          </div>
          <SellerCard className="p-4 sm:p-5">
            <SettingsRow
              icon={<Store size={18} />}
              title="Store details"
              subtitle={`${storeData.publicName || 'Your Store'} · ${storeData.businessType === 'restaurant' ? 'Restaurant' : 'Student Vendor'}`}
              onClick={() => setActiveModal('store-details')}
            />
            <SettingsRow
              icon={<MapPin size={18} />}
              title="Location"
              subtitle={storeData.address || 'No location selected yet'}
              onClick={() => setActiveModal('location')}
            />
          </SellerCard>
        </section>

        {/* Payout Section */}
        <section>
          <div className="mb-3 px-1">
            <h3 className="text-xl font-bold text-dark">Payout Information</h3>
          </div>
          <SellerCard className="p-4 sm:p-5">
            <SettingsRow
              icon={<CreditCard size={18} />}
              title="Payout details"
              subtitle={payoutData.bankName ? `${payoutData.bankName} - ${payoutData.accountNumber}` : 'No payout details added yet'}
              onClick={() => setActiveModal('payout')}
            />
          </SellerCard>
        </section>

        <section>
          <div className="mb-3 px-1">
            <h3 className="text-xl font-bold text-dark">Performance</h3>
          </div>
          <SellerCard className="p-4 sm:p-5">
            <SettingsRow
              icon={<MessageSquare size={18} />}
              title="Customer reviews"
              subtitle="See how buyers rate your restaurant and read their comments"
              onClick={() => setActiveModal('reviews')}
            />
          </SellerCard>
        </section>

        {/* Quick Actions Section */}
        <section>
          <div className="mb-3 px-1">
            <h3 className="text-xl font-bold text-dark">Quick actions</h3>
          </div>
          <SellerCard className="p-4 sm:p-5">
            <SettingsRow icon={<LogOut size={18} />} title="Logout" onClick={() => navigate('/seller/login')} />
          </SellerCard>
        </section>
      </div>

      {/* Modals */}
      <SettingsModal
        open={activeModal === 'store-details'}
        title="Store details"
        onClose={closeModal}
      >
        <StoreDetailsForm
          storeData={storeData}
          loading={isBusy('store-details')}
          onSave={handleSaveStoreDetails}
        />
      </SettingsModal>

      <SettingsModal
        open={activeModal === 'location'}
        title="Location"
        onClose={closeModal}
      >
        <div className="space-y-6">
          <StoreLocationForm
            storeData={storeData}
            loading={isBusy('location')}
            onLocationSelect={() => setIsLocationSearchOpen(true)}
          />
          {isLocationSearchOpen && (
            <SellerLocationSearchModal
              isOpen={isLocationSearchOpen}
              onClose={() => setIsLocationSearchOpen(false)}
              onLocationSelected={(location) => {
                handleSaveLocation(location);
              }}
            />
          )}
        </div>
      </SettingsModal>

      <SettingsModal
        open={activeModal === 'payout'}
        title="Payout details"
        onClose={closeModal}
      >
        <PayoutDetailsForm payoutData={payoutData} loading={isBusy('payout')} onSave={handleSavePayout} />
      </SettingsModal>

      <SettingsModal
        open={activeModal === 'reviews'}
        title="Customer reviews"
        subtitle="See what buyers think about your food, service, and completed orders."
        onClose={closeModal}
      >
        <SellerReviewsContent />
      </SettingsModal>
    </div>
  );
};

export default SellerSettings;
