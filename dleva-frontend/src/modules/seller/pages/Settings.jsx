import { useState, useEffect } from 'react';
import { Save, Store, CreditCard, MapPin, Camera, Upload, Shield, Building2, Phone, Navigation, X } from 'lucide-react';
import sellerSettings from '../../../services/sellerSettings';
import SellerLocationSearchModal from '../components/SellerLocationSearchModal';
import { logError } from '../../../utils/errorHandler';

const SellerSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false); // ✅ For location modal

  const [formData, setFormData] = useState({
    publicName: '',
    description: '',
    category: '',
    isActive: true,
    image: null,  // ✅ Single image field
    imagePreview: null,  // ✅ Single preview
    businessType: 'student_vendor',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });

  const [payoutData, setPayoutData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsFetching(true);
      setError(null);
      
      const { profile, restaurant } = await sellerSettings.getSettings();
      
      setFormData(prev => ({
        ...prev,
        // Restaurant data
        publicName: restaurant.name || '',
        description: restaurant.description || '',
        category: restaurant.category || '',
        isActive: restaurant.is_active || true,
        image: null,
        imagePreview: restaurant.image ? `http://127.0.0.1:8000${restaurant.image}` : null,  // ✅ Single image
        // Profile data
        businessType: profile.business_type || 'student_vendor',
        phone: profile.phone || '',
        address: restaurant.address || profile.address || '',  // ✅ Get address from restaurant first
        // ✅ GET COORDINATES FROM RESTAURANT (which is the source of truth for location) - Convert to numbers
        latitude: parseFloat(restaurant.latitude) || parseFloat(profile.latitude) || 0,
        longitude: parseFloat(restaurant.longitude) || parseFloat(profile.longitude) || 0,
      }));

      // Fetch payout details
      const payoutDetails = await sellerSettings.getPayoutDetails();
      if (payoutDetails) {
        setPayoutData({
          bankName: payoutDetails.bank_name || '',
          accountNumber: payoutDetails.account_number || '',
          accountName: payoutDetails.account_name || '',
        });
      }
    } catch (err) {
      logError(err, { context: 'Settings.fetchSettings' });
      setError(err.error || 'Failed to load settings');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePayoutChange = (e) => {
    const { name, value } = e.target;
    setPayoutData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {  // ✅ Single file handler
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: previewUrl
      }));
    }
  };

  const handleRemoveImage = () => {  // ✅ Single remove handler
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // Prepare FormData for file uploads
      const restaurantFormData = new FormData();
      restaurantFormData.append('name', formData.publicName);
      restaurantFormData.append('description', formData.description);
      restaurantFormData.append('category', formData.category);
      restaurantFormData.append('is_active', formData.isActive);
      restaurantFormData.append('address', formData.address);
      restaurantFormData.append('latitude', formData.latitude);  // ✅ ADD THIS
      restaurantFormData.append('longitude', formData.longitude);  // ✅ ADD THIS
      if (formData.image instanceof File) {
        restaurantFormData.append('image', formData.image);  // ✅ Single image
      }

      const profileFormData = new FormData();
      profileFormData.append('phone', formData.phone);
      profileFormData.append('address', formData.address);
      profileFormData.append('latitude', formData.latitude);
      profileFormData.append('longitude', formData.longitude);
      profileFormData.append('business_type', formData.businessType);

      // Save all data
      await Promise.all([
        sellerSettings.updateRestaurant(restaurantFormData),
        sellerSettings.updateProfile(profileFormData),
        sellerSettings.updatePayoutDetails(payoutData),
      ]);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      logError(err, { context: 'Settings.handleSaveSettings' });
      setError(err.error || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 pb-20 px-4 sm:px-6 md:px-8">
      
      {/* --- ERROR/SUCCESS MESSAGES --- */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-lg text-sm">
          ✓ Settings updated successfully!
        </div>
      )}
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark">Store Settings</h1>
            <p className="text-xs sm:text-sm text-muted mt-1">Manage your profile, location, and operating status.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover shadow-lg active:scale-95 transition-all disabled:opacity-70 min-h-[44px] whitespace-nowrap flex-shrink-0"
        >
            {isLoading ? 'Saving...' : 'Save Changes'}
            {!isLoading && <Save size={18} />}
        </button>
      </div>

      {/* --- MASTER SWITCH --- */}
      <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 transition-colors ${formData.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Store size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
                <h3 className={`text-base sm:text-lg font-bold ${formData.isActive ? 'text-green-800' : 'text-red-800'}`}>
                    {formData.isActive ? 'Store is OPEN' : 'Store is CLOSED'}
                </h3>
                <p className={`text-xs sm:text-sm ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.isActive 
                        ? "Customers can currently place orders." 
                        : "Your menu is hidden. No new orders can be placed."}
                </p>
            </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                name="isActive"
                className="sr-only peer" 
                checked={formData.isActive}
                onChange={handleInputChange}
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>

      {/* --- TABS --- */}
      <div className="flex border-b border-gray-200 overflow-x-auto -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
        <button 
            onClick={() => setActiveTab('profile')}
            className={`px-3 sm:px-6 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors min-h-[44px] flex items-center ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}
        >
            Store Profile
        </button>
        <button 
            onClick={() => setActiveTab('location')}
            className={`px-3 sm:px-6 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors min-h-[44px] flex items-center ${activeTab === 'location' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}
        >
            Location
        </button>
        <button 
            onClick={() => setActiveTab('payout')}
            className={`px-3 sm:px-6 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors min-h-[44px] flex items-center ${activeTab === 'payout' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}
        >
            Payout Details
        </button>
      </div>

      {/* --- TAB 1: STORE PROFILE --- */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4 sm:space-y-6">
                {/* ✅ SINGLE IMAGE UPLOAD - Works for both logo and banner */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-4">Store Image (Logo & Banner)</p>
                    
                    {formData.imagePreview ? (
                        <div className="space-y-4">
                            {/* Display as Logo */}
                            <div className="relative w-32 h-32 mx-auto">
                                <img 
                                    src={formData.imagePreview} 
                                    alt="Store Logo" 
                                    className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                                />
                            </div>

                            {/* Display as Banner */}
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                                <img 
                                    src={formData.imagePreview} 
                                    alt="Store Banner" 
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 justify-center flex-wrap">
                                <button
                                    onClick={handleRemoveImage}
                                    className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm min-h-[44px] flex-shrink-0"
                                >
                                    <X size={16} /> Remove
                                </button>
                                <label className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer text-sm min-h-[44px] flex items-center flex-shrink-0">
                                    <span>Change</span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <label className="relative w-full h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center group cursor-pointer overflow-hidden hover:border-primary transition-colors">
                            <div className="text-center">
                                <Upload className="text-gray-400 group-hover:text-primary mx-auto mb-2" size={32} />
                                <p className="text-sm font-bold text-gray-600">Click to upload image</p>
                                <p className="text-xs text-gray-400">Will be used as both logo and banner</p>
                            </div>
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </label>
                    )}
                    
                    <p className="text-xs text-muted mt-4">JPG or PNG • Will be displayed as both store logo and banner</p>
                </div>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Public Store Name</label>
                        <input 
                            type="text" 
                            name="publicName"
                            value={formData.publicName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-dark text-sm sm:text-base min-h-[44px]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Type</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select 
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm sm:text-base appearance-none min-h-[44px]"
                            >
                                <option value="restaurant">Restaurant</option>
                                <option value="student_vendor">Student Vendor</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                        <input 
                            type="text" 
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm sm:text-base min-h-[44px]"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm sm:text-base min-h-[44px]"
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Short Description</label>
                        <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm sm:text-base resize-none h-24"
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB 2: LOCATION --- */}
      {activeTab === 'location' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Current Location Display */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Current Location</label>
              
              {formData.address ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex gap-3">
                    <MapPin className="text-green-600 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-dark">{formData.address}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Coordinates: {(parseFloat(formData.latitude) || 0).toFixed(6)}, {(parseFloat(formData.longitude) || 0).toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex gap-3">
                    <MapPin className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-amber-900">No location set</p>
                      <p className="text-xs text-amber-700">Select your store location to get started</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Select Location Button */}
            <button
              type="button"
              onClick={() => setIsLocationSearchOpen(true)}
              className="w-full bg-primary text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <MapPin size={18} />
              {formData.address ? 'Change Location' : 'Select Location'}
            </button>

            {/* TIP */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              💡 <b>Tip:</b> Your exact coordinates will be set automatically when you select an address.
            </div>
        </div>
      )}

      {/* Location Search Modal */}
      <SellerLocationSearchModal
        isOpen={isLocationSearchOpen}
        onClose={() => setIsLocationSearchOpen(false)}
        onLocationSelected={(location) => {
          setFormData(prev => ({
            ...prev,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        }}
      />

      {/* --- TAB 3: PAYOUT --- */}
      {activeTab === 'payout' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-blue-50/50 flex gap-2 sm:gap-3">
                <Shield className="text-blue-600 shrink-0" size={20} />
                <div className="min-w-0">
                    <h3 className="font-bold text-blue-900 text-sm sm:text-base">Secure Payout Information</h3>
                    <p className="text-xs sm:text-sm text-blue-700">Earnings are transferred automatically every Tuesday. Ensure details match your registered business name.</p>
                </div>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select 
                            name="bankName"
                            value={payoutData.bankName}
                            onChange={handlePayoutChange}
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm sm:text-base appearance-none min-h-[44px]"
                        >
                            <option value="">Select Bank</option>
                            <option value="GTBank">GTBank</option>
                            <option value="Access Bank">Access Bank</option>
                            <option value="Zenith Bank">Zenith Bank</option>
                            <option value="UBA">UBA</option>
                            <option value="First Bank">First Bank</option>
                            <option value="Kuda Microfinance">Kuda Microfinance</option>
                            <option value="OPay">OPay</option>
                            <option value="PalmPay">PalmPay</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                    <input 
                        type="text" 
                        name="accountNumber"
                        maxLength={10}
                        value={payoutData.accountNumber}
                        onChange={handlePayoutChange}
                        className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono font-medium tracking-wider text-sm sm:text-base min-h-[44px]"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Name</label>
                    <input 
                        type="text" 
                        name="accountName"
                        value={payoutData.accountName}
                        onChange={handlePayoutChange}
                        className="w-full px-4 py-2.5 sm:py-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-500 font-bold cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                        disabled
                    />
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 text-right">Verified automatically</p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SellerSettings;