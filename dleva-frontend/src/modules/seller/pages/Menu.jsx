import { Edit2, Eye, EyeOff, Image as ImageIcon, Plus, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import sellerMenu from '../../../services/sellerMenu';
import { logError } from '../../../utils/errorHandler';
import { formatCurrency } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';
import MenuModal from '../components/MenuModal';
import SellerPageLoading from '../components/ui/SellerPageLoading';
import {
  SellerCard,
  SellerEmptyState,
  SellerFeedbackState,
  SellerPrimaryButton,
  SellerQuietButton,
  SellerSearchField,
  SellerStatusBadge,
} from '../components/ui/SellerPrimitives';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'paused', label: 'Paused' },
];

const MenuFilterTabs = ({ filters, value, onChange, getCount }) => (
  <div className="border-b border-gray-200">
    <div className="flex items-end">
      {filters.map((filter) => {
        const isActive = value === filter.id;
        const count = getCount(filter.id);

        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              'flex-1 border-b px-2 py-3 text-center text-sm font-semibold leading-none transition-colors',
              isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-dark'
            )}
          >
            <span>{filter.label}</span>
            <span className={cn('ml-1 text-[11px] font-bold', isActive ? 'text-primary' : 'text-gray-400')}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const getMenuImage = (item) => {
  const image = item.cloudinary_image_url || item.image;
  if (!image) return null;
  return image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL}${image}`;
};

const SellerMenu = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyItemId, setBusyItemId] = useState(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const data = await sellerMenu.getMenuItems();
        setItems(data);
        setError(null);
      } catch (err) {
        logError(err, { context: 'SellerMenu.fetchMenuItems' });
        setError(err.error || 'Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this menu item? Buyers will no longer see it.')) return;

    try {
      setBusyItemId(id);
      await sellerMenu.deleteMenuItem(id);
      setItems((previous) => previous.filter((item) => item.id !== id));
      setError(null);
    } catch (err) {
      setError(err.error || 'Failed to delete item');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await sellerMenu.updateMenuItem(editingItem.id, formData);
        setItems((previous) => previous.map((item) => (item.id === editingItem.id ? updated : item)));
      } else {
        const created = await sellerMenu.addMenuItem(formData);
        setItems((previous) => [created, ...previous]);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setError(null);
      return true;
    } catch (err) {
      setError(err.error || 'Failed to save item');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAvailability = async (id, currentAvailable) => {
    try {
      setBusyItemId(id);
      const updated = await sellerMenu.updateMenuItem(id, { available: !currentAvailable });
      setItems((previous) => previous.map((item) => (item.id === id ? updated : item)));
      setError(null);
    } catch (err) {
      setError(err.error || 'Failed to update availability');
    } finally {
      setBusyItemId(null);
    }
  };

  const stats = useMemo(() => {
    const live = items.filter((item) => item.available).length;
    return {
      total: items.length,
      live,
      paused: items.length - live,
    };
  }, [items]);

  const filterCounts = useMemo(
    () => ({
      all: stats.total,
      live: stats.live,
      paused: stats.paused,
    }),
    [stats]
  );

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category_name?.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'live' && item.available) ||
        (activeFilter === 'paused' && !item.available);

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, items, searchTerm]);

  if (loading) {
    return <SellerPageLoading variant="menu" />;
  }

  return (
    <div className="space-y-4">
      {error ? <SellerFeedbackState type="error" title="Menu update issue" message={error} /> : null}

      <SellerCard className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">Menu overview</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-dark sm:text-3xl">
              {stats.total} menu item{stats.total === 1 ? '' : 's'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {stats.live} live, {stats.paused} paused
            </p>
          </div>

          <SellerPrimaryButton className="w-auto shrink-0 px-4 sm:w-auto" onClick={handleAddNew} icon={<Plus size={18} />}>
            Add Item
          </SellerPrimaryButton>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <SellerSearchField
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Search dishes, combos, or drinks"
            className="flex-1"
          />
          <SellerPrimaryButton className="hidden sm:inline-flex sm:w-auto" onClick={handleAddNew} icon={<Plus size={18} />}>
            Add New Item
          </SellerPrimaryButton>
        </div>
      </SellerCard>

      <div className="sticky top-[72px] z-20 -mx-4 bg-white/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-0">
        <SellerCard className="overflow-hidden px-3 pt-2">
          <MenuFilterTabs
            filters={FILTERS}
            value={activeFilter}
            onChange={setActiveFilter}
            getCount={(filterId) => filterCounts[filterId] || 0}
          />
        </SellerCard>
      </div>

      {filteredItems.length === 0 ? (
        <SellerEmptyState
          icon={searchTerm ? <Search size={24} /> : <UtensilsCrossed size={24} />}
          title={items.length === 0 ? 'No menu items yet' : 'No menu items match that search'}
          description={
            items.length === 0
              ? 'Start by adding your first item so buyers can begin ordering.'
              : 'Try another search term, change the filter, or clear the search.'
          }
          action={<SellerPrimaryButton onClick={handleAddNew}>Add First Item</SellerPrimaryButton>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const imageUrl = getMenuImage(item);
            const isBusy = busyItemId === item.id;
            return (
              <SellerCard key={item.id} interactive className="overflow-hidden border-gray-100 bg-white">
                <div className="flex gap-3 p-3 sm:block sm:p-0">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-44 sm:w-full sm:rounded-none">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.name} className={cn('h-full w-full object-cover', !item.available && 'opacity-70 grayscale')} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <SellerStatusBadge status={item.available ? 'active' : 'hidden'}>{item.available ? 'Live' : 'Paused'}</SellerStatusBadge>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-dark">{item.name}</h3>
                        <p className="mt-1 text-base font-bold text-primary">{formatCurrency(Number(item.price || 0))}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item.id, item.available)}
                        disabled={isBusy}
                        className={cn(
                          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                          item.available ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-muted'
                        )}
                        aria-label={item.available ? 'Pause item' : 'Make item live'}
                      >
                        {item.available ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.category_name ? <SellerStatusBadge className="border-gray-200 bg-gray-50 text-gray-700">{item.category_name}</SellerStatusBadge> : null}
                      {!imageUrl ? <SellerStatusBadge status="pending">Needs photo</SellerStatusBadge> : null}
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
                      {item.description || 'Add a short description to help buyers choose this item faster.'}
                    </p>

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <SellerPrimaryButton className="min-w-0" onClick={() => handleEdit(item)} icon={<Edit2 size={16} />}>
                        Edit
                      </SellerPrimaryButton>
                      <SellerQuietButton
                        className="h-[46px] min-h-[46px] w-12 border border-red-100 bg-red-50 px-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleDelete(item.id)}
                        disabled={isBusy}
                        icon={<Trash2 size={16} />}
                        aria-label={`Remove ${item.name}`}
                      >
                        <span className="sr-only">Remove</span>
                      </SellerQuietButton>
                    </div>
                  </div>
                </div>
              </SellerCard>
            );
          })}
        </div>
      )}

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
