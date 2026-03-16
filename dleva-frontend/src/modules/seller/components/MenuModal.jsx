import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

const MenuModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  // 1. STATE: MATCHING YOUR DJANGO MODEL
  // We track both the 'file' (for the API) and 'preview' (for the UI)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
    image: null,       // This will hold the File object
    imagePreview: ''   // This holds the URL string for display
  });

  // 2. PRE-FILL DATA (If Editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        available: initialData.available ?? true,
        image: null, // We don't change the file unless they upload a new one
        imagePreview: initialData.image || '' // Load existing URL
      });
    } else {
      // Reset for New Item
      setFormData({ name: '', description: '', price: '', available: true, image: null, imagePreview: '' });
    }
  }, [initialData, isOpen]);

  // 3. HANDLE IMAGE UPLOAD
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file, // Save file for Backend (Phase 9 API)
        imagePreview: URL.createObjectURL(file) // Create temporary URL for UI
      });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Prepare data to send back to the parent
    // Note: In Phase 9, we will use 'FormData()' here to send files to Django
    onSubmit({
        ...formData,
        price: parseFloat(formData.price), // Ensure Decimal
        // If editing, keep old ID, else undefined (backend handles new IDs)
        id: initialData?.id 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg">{initialData ? 'Edit Item' : 'Add New Item'}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        {/* Scrollable Form */}
        <div className="p-4 overflow-y-auto space-y-4">
            
            {/* Image Upload Field */}
            <div className="w-full h-40 relative group">
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                />
                
                <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 group-hover:bg-gray-100 transition-colors overflow-hidden">
                    {formData.imagePreview ? (
                        <img 
                            src={formData.imagePreview} 
                            className="w-full h-full object-cover" 
                            alt="Preview" 
                        />
                    ) : (
                        <>
                            <Upload size={24} className="mb-2"/>
                            <span className="text-xs font-medium">Click to upload image</span>
                        </>
                    )}
                    
                    {/* Overlay Hint */}
                    {formData.imagePreview && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Change Image</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Name */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Item Name</label>
                <input 
                    type="text" 
                    required
                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 outline-none font-medium"
                    placeholder="e.g. Jollof Rice"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </div>

            {/* Price */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Price (₦)</label>
                <input 
                    type="number" 
                    required
                    step="0.01" // For DecimalField
                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 outline-none font-medium"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
            </div>

            {/* Description (Optional) */}
            <div>
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <span className="text-[10px] text-gray-400">Optional</span>
                </div>
                <textarea 
                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 outline-none h-24 resize-none text-sm"
                    placeholder="Describe the meal ingredients..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
            </div>

            {/* Available Toggle (Synced with model default) */}
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                 <input 
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    className="w-5 h-5 text-primary rounded focus:ring-primary"
                 />
                 <label className="text-sm font-medium text-dark">Mark as Available immediately?</label>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button 
                onClick={handleSubmit}
                // Disable if required fields (Name/Price) are empty
                disabled={!formData.name || !formData.price} 
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {initialData ? 'Save Changes' : 'Create Item'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default MenuModal;