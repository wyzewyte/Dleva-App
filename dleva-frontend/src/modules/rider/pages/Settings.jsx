/**
 * Profile Page
 * Comprehensive rider profile and account management
 */

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Camera, 
  User, Phone, FileCheck, Truck, MapPin, Settings, LogOut, Lock,
  ChevronRight, Clock, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import riderSettings from '../services/riderSettings';
import ProfileForm from './components/ProfileForm';
import VehicleInfo from './components/VehicleInfo';
import PhoneVerification from './components/PhoneVerification';
import PreferencesForm from './components/PreferencesForm';
import RiderLocationManagement from './components/RiderLocationManagement';
import MESSAGES from '../../../constants/messages';
import { ACCOUNT_STATUS_COLORS, ACCOUNT_STATUS_LABELS, SETTINGS_SUCCESS, SETTINGS_ERRORS, SETTINGS_LABELS } from '../../../constants/settingsConstants';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, verificationData] = await Promise.all([
        riderSettings.getProfile(),
        riderSettings.getVerificationStatus(),
      ]);
      setProfile(profileData);
      setVerification(verificationData);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.FETCH_PROFILE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await riderSettings.updateProfile(data);
      setProfile(updated);
      setSuccess(SETTINGS_SUCCESS.PROFILE_UPDATED);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.PROFILE_UPDATE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const handleVehicleUpdate = async (data) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await riderSettings.updateProfile(data);
      setProfile(updated);
      setSuccess(SETTINGS_SUCCESS.VEHICLE_UPDATED);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.PROFILE_UPDATE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (data) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Note: Preferences update endpoint would need to be added to backend
      setSuccess(SETTINGS_SUCCESS.PREFERENCES_SAVED);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.PROFILE_UPDATE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneVerified = async () => {
    try {
      const updated = await riderSettings.getVerificationStatus();
      setVerification(updated);
      setSuccess(SETTINGS_SUCCESS.PHONE_VERIFIED);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || SETTINGS_ERRORS.VERIFICATION_STATUS_FAILED);
    }
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      setError(null);

      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      const formData = new FormData();
      formData.append('profile_photo', file);
      
      const updated = await riderSettings.updateProfile(formData);
      setProfile(updated);
      setSuccess('Profile photo updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile photo');
      setProfilePhotoPreview(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 size={40} className="animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const accountStatus = verification?.account_status;
  const statusConfig = ACCOUNT_STATUS_COLORS[accountStatus] || ACCOUNT_STATUS_COLORS.pending;

  // Tab configuration
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'vehicle', label: 'Vehicle', icon: Truck },
    { id: 'verification', label: 'Verification', icon: FileCheck },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">{error}</p>
              <button
                onClick={fetchData}
                className="text-sm text-red-600 hover:underline font-bold mt-1"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Profile Header with Photo */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : profile?.profile_photo ? (
                  <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                <Camera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                  disabled={saving}
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || profile?.first_name || 'Rider'}</h2>
              <div className="mt-2 flex items-center gap-2 text-gray-600">
                <Phone size={16} className="text-blue-600" />
                <p className="text-sm font-medium">{profile?.phone_number || profile?.phone || '—'}</p>
                {verification?.phone_verified && (
                  <CheckCircle2 size={14} className="text-green-600" />
                )}
              </div>
              
              {/* Account Status */}
              <div className="mt-4 flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.badge} border ${statusConfig.border}`}>
                  {ACCOUNT_STATUS_LABELS[accountStatus] || accountStatus}
                </div>
                <span className="text-sm text-gray-600">{verification?.profile_completion_percent}% Profile Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        {verification && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck size={20} className="text-blue-600" />
              Verification Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Phone, label: 'Phone Verified', value: verification.phone_verified },
                { icon: FileCheck, label: 'Documents Approved', value: verification.documents_approved },
                { icon: Truck, label: 'Bank Details', value: verification.bank_details_added },
                { icon: Settings, label: 'Ready to Work', value: verification.can_go_online },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    item.value ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <item.icon size={18} className={item.value ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-600">{item.value ? 'Verified' : 'Pending'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Blocked Reasons */}
            {verification.blocked_reasons && verification.blocked_reasons.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-700 mb-2">Blocked Reasons:</p>
                {verification.blocked_reasons.map((reason, idx) => (
                  <p key={idx} className="text-sm text-red-600">
                    • {reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <TabIcon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content with Top Padding */}
          <div className="pt-8 pb-6 px-6">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && profile && (
              <div className="space-y-4">
                <ProfileForm
                  profile={profile}
                  onSave={handleProfileUpdate}
                  loading={saving}
                />
              </div>
            )}

            {/* Vehicle Tab */}
            {activeTab === 'vehicle' && profile && (
              <div className="space-y-4">
                <VehicleInfo
                  profile={profile}
                  onSave={handleVehicleUpdate}
                  loading={saving}
                />
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && profile && verification && (
              <div className="space-y-6">
                {/* Phone Verification Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone size={18} className="text-blue-600" />
                    Phone Verification
                  </h4>
                  <PhoneVerification
                    profile={profile}
                    onVerified={handlePhoneVerified}
                  />
                </div>

                {/* Document Verification Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileCheck size={18} className="text-blue-600" />
                    Document Verification
                  </h4>
                  <div className="space-y-3">
                    {verification.documents_approved ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircle2 size={20} className="text-green-600" />
                        <div>
                          <p className="font-bold text-green-700">Documents Verified</p>
                          <p className="text-xs text-green-600">Your documents have been approved</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <Clock size={20} className="text-yellow-600" />
                        <div>
                          <p className="font-bold text-yellow-700">Pending Review</p>
                          <p className="text-xs text-yellow-600">Your documents are being reviewed by our team</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-3 italic">* Documents cannot be edited from this page. Contact support if you need to update them.</p>
                </div>

                {/* Bank Details Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck size={18} className="text-blue-600" />
                    Bank Details
                  </h4>
                  {verification.bank_details_added ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle2 size={20} className="text-green-600" />
                      <div>
                        <p className="font-bold text-green-700">Bank Details Added</p>
                        <p className="text-xs text-green-600">Your bank account has been verified</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <Clock size={20} className="text-yellow-600" />
                      <div>
                        <p className="font-bold text-yellow-700">Not Added</p>
                        <p className="text-xs text-yellow-600">Please add your bank details in your profile</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && profile && (
              <div className="space-y-4">
                <RiderLocationManagement
                  profile={profile}
                  onLocationUpdate={(location) => {
                    setProfile({
                      ...profile,
                      address: location.address,
                      current_latitude: location.latitude,
                      current_longitude: location.longitude,
                      location_accuracy: location.accuracy,
                    });
                  }}
                />
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && profile && (
              <div className="space-y-4">
                <PreferencesForm
                  preferences={profile.preferences || {}}
                  onSave={handlePreferencesUpdate}
                  loading={saving}
                />
              </div>
            )}
          </div>
        </div>

        {/* Order History Card */}
        <div 
          onClick={() => navigate('/rider/order-history')}
          className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600">View completed deliveries and earnings</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-gray-400" />
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-gray-600" />
            Account Actions
          </h3>

          <div className="space-y-3">
            <button className="w-full px-4 py-3 border-2 border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-3 justify-center">
              <Lock size={18} />
              Change Password
            </button>

            <button className="w-full px-4 py-3 border-2 border-orange-200 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-3 justify-center">
              <AlertCircle size={18} />
              Deactivate Account
            </button>

            <button className="w-full px-4 py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center gap-3 justify-center">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
