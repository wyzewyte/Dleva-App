import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, MapPin, Phone, Mail, User, Loader2, Camera } from 'lucide-react';
import buyerProfile from '../../../services/buyerProfile';
import { useAuth } from '../../../modules/auth/context/AuthContext'; // ✅ Import useAuth
import { logError } from '../../../utils/errorHandler';

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth(); // ✅ Get user and setUser from context
  const [profile, setProfile] = useState(user); // Initialize with context user, which is always available here
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!user); // ✅ No loading needed if user from context exists
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    image: null, // For file object
    imagePreview: null, // For preview URL
  });

  // ✅ This effect now only runs once to populate the form from the context user
  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        imagePreview: user.image || null,
      });
      setLoading(false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Create a payload, excluding the preview URL
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };
      if (formData.image instanceof File) {
        payload.image = formData.image;
      }

      const updatedProfile = await buyerProfile.updateProfile(payload);
      
      // ✅ Update component state and global context state
      setProfile(updatedProfile);
      setUser(updatedProfile); // ✅ THIS IS THE KEY CHANGE
      setFormData({
        name: updatedProfile.name || '',
        email: updatedProfile.email || '',
        phone: updatedProfile.phone || '',
        address: updatedProfile.address || '',
        image: null,
        imagePreview: updatedProfile.image || null,
      });
      
      setIsEditing(false);
    } catch (err) {
      logError(err, { context: 'Profile.handleSave' });
      setError(err.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout(); // ✅ Use logout from context
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-dark">Profile</h1>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <img
              src={formData.imagePreview || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
            />
            {isEditing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary-hover">
                  <Camera size={16} />
                </button>
              </>
            )}
          </div>
          <h2 className="text-xl font-bold text-dark">{profile?.name || formData.name}</h2>
          <p className="text-sm text-muted">{profile?.email || formData.email}</p>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-xl p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-dark font-bold mt-1">{profile?.name || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
            {isEditing ? (
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-dark font-bold mt-1">{profile?.email || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
            {isEditing ? (
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-dark font-bold mt-1">{profile?.phone || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-dark font-bold mt-1">{profile?.address || 'Not set'}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-3">
            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 border-2 border-gray-200 text-dark font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors"
          >
            Edit Profile
          </button>
        )}

        {/* Settings */}
        <div className="bg-white rounded-xl overflow-hidden">
          <button className="w-full p-4 flex items-center gap-3 border-b hover:bg-gray-50">
            <MapPin size={20} className="text-primary" />
            <div className="flex-1 text-left">
              <p className="font-bold text-dark">Delivery Location</p>
              <p className="text-xs text-muted">{profile?.address || 'Not set'}</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="w-full p-4 flex items-center gap-3 border-b hover:bg-gray-50"
          >
            <User size={20} className="text-primary" />
            <div className="flex-1 text-left">
              <p className="font-bold text-dark">Order History</p>
              <p className="text-xs text-muted">View your past orders</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/support')}
            className="w-full p-4 flex items-center gap-3 border-b hover:bg-gray-50"
          >
            <Phone size={20} className="text-primary" />
            <div className="flex-1 text-left">
              <p className="font-bold text-dark">Help & Support</p>
              <p className="text-xs text-muted">Contact support or view FAQs</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/change-password')}
            className="w-full p-4 flex items-center gap-3 border-b hover:bg-gray-50"
          >
            <Lock size={20} className="text-primary" />
            <div className="flex-1 text-left">
              <p className="font-bold text-dark">Change Password</p>
              <p className="text-xs text-muted">Update your password</p>
            </div>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-3 hover:bg-red-50"
          >
            <LogOut size={20} className="text-red-600" />
            <div className="flex-1 text-left">
              <p className="font-bold text-red-600">Logout</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;