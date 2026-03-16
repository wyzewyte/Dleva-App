import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import MenuModal from '../components/MenuModal';
import sellerMenu from '../../../services/sellerMenu';
import { logError } from '../../../utils/errorHandler';

const SellerMenu = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const data = await sellerMenu.getMenuItems();
      setItems(data);
      setError(null);
    } catch (err) {
      logError(err, { context: 'Menu.fetchMenuItems' });
      setError(err.error || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await sellerMenu.deleteMenuItem(id);
        setItems(items.filter(item => item.id !== id));
      } catch (err) {
        alert(err.error || 'Failed to delete item');
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await sellerMenu.updateMenuItem(editingItem.id, formData);
        setItems(items.map(item => item.id === editingItem.id ? updated : item));
      } else {
        const created = await sellerMenu.addMenuItem(formData);
        setItems([created, ...items]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.error || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAvailability = async (id, currentAvailable) => {
    try {
      const item = items.find(i => i.id === id);
      if (item) {
        const updated = await sellerMenu.updateMenuItem(id, { available: !currentAvailable });
        setItems(items.map(i => i.id === id ? updated : i));
      }
    } catch (err) {
      alert(err.error || 'Failed to update availability');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark">Menu Management</h1>
          <p className="text-sm text-muted">Manage what's cooking today.</p>
        </div>
        <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search food items..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white py-3 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className={`bg-white p-3 rounded-2xl border shadow-sm flex gap-4 transition-all ${!item.available ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
               {item.image ? (
                 <img 
                   src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL}${item.image}`} 
                   alt={item.name} 
                   className="w-full h-full object-cover" 
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>
               )}
               {!item.available && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-[10px] font-bold uppercase border border-white px-2 py-1 rounded">Sold Out</span></div>
               )}
            </div>

            <div className="flex-1 flex flex-col justify-between py-1">
               <div>
                  <h3 className="font-bold text-dark line-clamp-1">{item.name}</h3>
                  <p className="text-sm text-muted">{item.description?.slice(0, 30)}...</p>
                  <p className="font-bold text-primary mt-1">₦{Number(item.price).toLocaleString()}</p>
               </div>

               <div className="flex justify-between items-center mt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                     <div 
                       className={`w-8 h-5 rounded-full p-0.5 transition-colors ${item.available ? 'bg-green-500' : 'bg-gray-300'}`}
                       onClick={() => toggleAvailability(item.id, item.available)}
                     >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${item.available ? 'translate-x-3' : 'translate-x-0'}`}></div>
                     </div>
                     <span className="text-[10px] font-medium text-muted">{item.available ? 'Active' : 'Hidden'}</span>
                  </label>

                  <div className="flex gap-1">
                    <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      <MenuModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={editingItem}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

    </div>
  );
};

export default SellerMenu;