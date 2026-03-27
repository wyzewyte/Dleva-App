import { useState, useEffect, useRef } from 'react';
import { X, Upload, ChevronDown, Check, Tag } from 'lucide-react'; // Added icons
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { logError } from '../../../utils/errorHandler';

const MenuModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
    category: null,
    image: null,
    imagePreview: ''
  });

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
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
        imagePreview: initialData.image || ''
      });
    } else {
      setFormData({ name: '', description: '', price: '', available: true, category: null, image: null, imagePreview: '' });
    }
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        id: initialData?.id 
    });
    onClose();
  };

  // Helper to find selected category object
  const selectedCategory = categories.find(c => c.id === formData.category);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="bg-white rounded-3xl w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-xl text-gray-800">{initialData ? 'Edit Item' : 'New Menu Item'}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={22}/></button>
        </div>

        {/* Scrollable Form */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
            
            {/* Image Upload */}
            <div className="group relative w-full h-44 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer">
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                />
                
                {formData.imagePreview ? (
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
                onClick={handleSubmit}
                disabled={!formData.name || !formData.price} 
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                {initialData ? 'Save Changes' : 'Create Item'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default MenuModal;