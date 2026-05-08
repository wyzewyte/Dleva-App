import { useState, useEffect, useRef } from 'react';
import { X, Upload, ChevronDown, Check, Tag, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { logError } from '../../../utils/errorHandler';
import cloudinaryUpload from '../../../services/cloudinaryUpload';

const MenuModal = ({ isOpen, onClose, onSubmit, initialData, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
    category: null,
    image: null,
    imagePreview: '',
    cloudinary_image_id: '',
    cloudinary_image_url: ''
  });

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        available: initialData.available ?? true,
        category: initialData.category || null,
        image: null,
        imagePreview: initialData.cloudinary_image_url || initialData.image || '',
        cloudinary_image_id: initialData.cloudinary_image_id || '',
        cloudinary_image_url: initialData.cloudinary_image_url || ''
      });
    } else {
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        available: true, 
        category: null, 
        image: null, 
        imagePreview: '',
        cloudinary_image_id: '',
        cloudinary_image_url: ''
      });
    }
    setUploadError('');
  }, [initialData, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get(API_ENDPOINTS.MENU.CATEGORIES);
        const cats = response.data.results || [];
        setCategories(cats.filter(cat => cat.is_active));
      } catch (err) {
        logError(err, { context: 'MenuModal.fetchCategories' });
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = cloudinaryUpload.validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    // Show preview while uploading
    setFormData(prev => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file)
    }));

    // Upload to Cloudinary
    try {
      setUploadingImage(true);
      setUploadError('');
      
      // If editing, include menu ID for upload
      let uploadResult;
      if (initialData?.id) {
        uploadResult = await cloudinaryUpload.uploadMenuItemImage(file, initialData.id);
      } else {
        // For new items, we'll upload when saving (need menu ID first)
        // So just set the file for now
        return;
      }

      // Store cloudinary IDs
      setFormData(prev => ({
        ...prev,
        cloudinary_image_id: uploadResult.public_id,
        cloudinary_image_url: uploadResult.url
      }));
    } catch (error) {
      setUploadError(error.error || 'Failed to upload image');
      logError(error, { context: 'MenuModal.handleImageChange' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For new items with images, upload first
    let finalFormData = {
        ...formData,
        price: parseFloat(formData.price),
        id: initialData?.id 
    };

    // If adding new item with image but no cloudinary ID yet, upload it
    if (!initialData && formData.image && !formData.cloudinary_image_id) {
      try {
        setUploadingImage(true);
        setUploadError('');
        // We can't upload to menu-specific endpoint until item exists
        // So we'll pass the file to parent and let them handle it
      } catch (error) {
        setUploadError('Failed to prepare image for upload');
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    const saved = await onSubmit(finalFormData);
    if (saved) onClose();
  };

  // Helper to find selected category object
  const selectedCategory = categories.find(c => c.id === formData.category);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <form onSubmit={handleSubmit} className="bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-xl text-gray-800">{initialData ? 'Edit Item' : 'New Menu Item'}</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={22}/></button>
        </div>

        {/* Scrollable Form */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar bg-[#fbfbfa]">
            
            {/* Upload Error */}
            {uploadError && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Upload Error</p>
                  <p className="text-xs text-red-700 mt-0.5">{uploadError}</p>
                </div>
              </div>
            )}
            
            {/* Image Upload */}
            <div className="group relative w-full h-44 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer">
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                />
                
                {uploadingImage ? (
                  <div className="text-center">
                    <Loader2 size={28} className="text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-600">Uploading image...</p>
                  </div>
                ) : formData.imagePreview ? (
                    <>
                        <img src={formData.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white font-semibold text-sm">Change Photo</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="bg-primary/10 p-3 rounded-full inline-block mb-2 text-primary">
                            <Upload size={24}/>
                        </div>
                        <p className="text-sm font-semibold text-gray-600">Upload Product Image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5">
                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Item Name</label>
                    <input 
                        type="text" 
                        required
                        className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                        placeholder="e.g. Seafood Okra"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Price (₦)</label>
                    <input 
                        type="number" 
                        required
                        className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                </div>

                {/* Better Custom Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Category</label>
                    
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={categoriesLoading}
                        className={`w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between transition-all hover:bg-gray-100/50 ${isDropdownOpen ? 'ring-4 ring-primary/10 border-primary bg-white' : ''}`}
                    >
                        <div className="flex items-center gap-2">
                            {selectedCategory ? (
                                <span className="flex items-center gap-2 font-medium text-gray-800">
                                    <span className="text-lg">{selectedCategory.icon}</span>
                                    {selectedCategory.name}
                                </span>
                            ) : (
                                <span className="text-gray-400 font-medium">Select a category...</span>
                            )}
                        </div>
                        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute z-30 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                            <button
                                type="button"
                                onClick={() => { setFormData({...formData, category: null}); setIsDropdownOpen(false); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-between"
                            >
                                None
                                {!formData.category && <Check size={16} className="text-primary" />}
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setFormData({...formData, category: cat.id});
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-primary/5 flex items-center justify-between transition-colors"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-base">{cat.icon || <Tag size={14}/>}</span>
                                        {cat.name}
                                    </span>
                                    {formData.category === cat.id && <Check size={16} className="text-primary" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Description</label>
                    <textarea 
                        className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all h-24 resize-none text-sm font-medium"
                        placeholder="What's inside this dish?"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                </div>

                {/* Available Toggle */}
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100/50 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">Available</span>
                        <span className="text-[11px] text-gray-400 font-medium uppercase">Visible to customers</span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={formData.available}
                            onChange={(e) => setFormData({...formData, available: e.target.checked})}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                </label>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white">
            <button 
                type="submit"
                disabled={!formData.name || !formData.price || isSubmitting || uploadingImage} 
                className="inline-flex w-full items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                {isSubmitting || uploadingImage ? <Loader2 size={18} className="animate-spin" /> : null}
                {isSubmitting ? 'Saving...' : uploadingImage ? 'Uploading image...' : initialData ? 'Save Changes' : 'Create Item'}
            </button>
        </div>

      </form>
    </div>
  );
};

export default MenuModal;
