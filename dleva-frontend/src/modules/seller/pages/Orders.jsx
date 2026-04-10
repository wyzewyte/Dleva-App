import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Loader2, UtensilsCrossed, ChefHat, Package, Bike, CheckCircle2, Clock } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import OrderModal from '../components/OrderModal';
import sellerOrders from '../../../services/sellerOrders';
import { logError } from '../../../utils/errorHandler';

// ─── Column Config ────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id: 'new',
    label: 'New Orders',
    shortLabel: 'New',
    icon: Clock,
    accent: '#f47b00',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    headerBg: 'bg-orange-50',
    dot: 'bg-orange-500',
    statuses: ['pending'],
    nextStatus: 'confirming',
  },
  {
    id: 'preparing',
    label: 'Cooking',
    shortLabel: 'Cooking',
    icon: ChefHat,
    accent: '#1a4731',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-50',
    dot: 'bg-emerald-600',
    statuses: ['confirming', 'preparing'],
    nextStatus: 'preparing',
  },
  {
    id: 'ready',
    label: 'Ready for Pickup',
    shortLabel: 'Ready',
    icon: Package,
    accent: '#0ea5e9',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    headerBg: 'bg-sky-50',
    dot: 'bg-sky-500',
    statuses: ['available_for_pickup', 'awaiting_rider', 'assigned', 'arrived_at_pickup'],
    nextStatus: 'available_for_pickup',
  },
  {
    id: 'rider_en_route',
    label: 'On the Way',
    shortLabel: 'En Route',
    icon: Bike,
    accent: '#8b5cf6',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    headerBg: 'bg-violet-50',
    dot: 'bg-violet-500',
    statuses: ['picked_up'],
  },
  {
    id: 'history',
    label: 'Delivered',
    shortLabel: 'Done',
    icon: CheckCircle2,
    accent: '#6b7280',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    headerBg: 'bg-gray-50',
    dot: 'bg-gray-400',
    statuses: ['delivered', 'cancelled'],
  },
];

// ─── Live Pulse Indicator ─────────────────────────────────────────────────────

const LivePulse = () => (
  <div className="flex items-center gap-1.5">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
    <span className="text-xs font-semibold text-green-600">Live</span>
  </div>
);

// ─── Column Header ────────────────────────────────────────────────────────────

const ColumnHeader = ({ col, count }) => {
  const Icon = col.icon;
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 ${col.headerBg} border-b ${col.border}`}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${col.accent}15` }}>
          <Icon size={14} style={{ color: col.accent }} />
        </div>
        <span className="text-xs font-bold text-dark uppercase tracking-wide">{col.label}</span>
      </div>
      {count > 0 && (
        <span
          className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full min-w-[22px] text-center"
          style={{ backgroundColor: col.accent }}
        >
          {count}
        </span>
      )}
    </div>
  );
};

// ─── Empty Column State ───────────────────────────────────────────────────────

const EmptyColumn = ({ col }) => {
  const Icon = col.icon;
  return (
    <div className="flex flex-col items-center justify-center h-28 gap-2 opacity-40">
      <Icon size={24} className="text-gray-400" />
      <span className="text-xs font-medium text-gray-400">No orders</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('new');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await sellerOrders.getOrders();
      setOrders(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      logError(err, { context: 'SellerOrders.fetchOrders' });
      setError(err.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 60000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders(true);
    setIsRefreshing(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await sellerOrders.updateOrderStatus(orderId, newStatus);
      // ✅ FIXED: Only update UI after successful API response
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      const msg = err?.error || err?.message || 'Failed to update order status';
      console.error('[STATUS_UPDATE_ERROR]', { orderId, newStatus, error: err });
      
      // ✅ FIXED: More detailed error message
      const fullMessage = err?.details?.message || err?.details?.reason || msg;
      alert(`❌ ${fullMessage}\n\nPlease check:\n- Delivery address is set\n- Restaurant location is set\n- Riders are available`);
      
      // ✅ FIXED: Refresh orders to sync with backend state
      // This ensures UI matches actual database state if anything changed
      fetchOrders(true);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getColumnOrders = (col) => orders.filter(o => col.statuses.includes(o.status));
  const totalActive = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg gap-3">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
          <ChefHat size={28} className="text-primary" />
        </div>
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="text-sm text-muted font-medium">Loading kitchen display...</p>
      </div>
    );
  }

  const activeColumn = COLUMNS.find(c => c.id === activeTab);

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-surface border-b border-gray-200 shadow-sm flex-shrink-0 z-40 sticky top-0 w-full">
        <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2 sm:py-3">

          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <ChefHat size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-dark">Kitchen Display</h1>
                <LivePulse />
              </div>
              <p className="text-xs text-muted hidden sm:block">
                {totalActive > 0
                  ? `${totalActive} active order${totalActive !== 1 ? 's' : ''}`
                  : 'All caught up'
                }
                {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>

          {/* Stats — desktop only */}
          <div className="hidden lg:flex items-center gap-3">
            {COLUMNS.slice(0, 4).map(col => {
              const count = getColumnOrders(col).length;
              if (count === 0) return null;
              return (
                <div key={col.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ borderColor: `${col.accent}30`, backgroundColor: `${col.accent}08` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.accent }} />
                  <span className="text-xs font-bold" style={{ color: col.accent }}>{count}</span>
                  <span className="text-xs text-muted">{col.shortLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCcw size={16} className={`text-dark ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 sm:mx-6 mb-3 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100">
            {error}
          </div>
        )}

        {/* ── Mobile / Tablet Tab Bar ── */}
        <div className="lg:hidden flex gap-2 overflow-x-auto px-2 sm:px-6 pb-2 scrollbar-hide">
          {COLUMNS.map(col => {
            const count = getColumnOrders(col).length;
            const isActive = activeTab === col.id;
            const Icon = col.icon;
            return (
              <button
                key={col.id}
                onClick={() => setActiveTab(col.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-muted hover:text-dark'
                }`}
                style={isActive ? { backgroundColor: col.accent } : {}}
              >
                <Icon size={13} />
                {col.shortLabel}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-white text-dark'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Kanban Board — Desktop ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden gap-3 p-4">
        {COLUMNS.map(col => {
          const columnOrders = getColumnOrders(col);
          return (
            <div
              key={col.id}
              className={`flex flex-col flex-1 min-w-0 rounded-2xl border ${col.border} ${col.bg} overflow-hidden`}
            >
              <ColumnHeader col={col} count={columnOrders.length} />
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {columnOrders.length === 0 ? (
                  <EmptyColumn col={col} />
                ) : (
                  columnOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Single Column View — Mobile & Tablet ── */}
      <div className="lg:hidden flex-1 overflow-y-auto px-1 pt-2 pb-3">
        {activeColumn && (() => {
          const columnOrders = getColumnOrders(activeColumn);
          return (
            <div className={`rounded-2xl border ${activeColumn.border} ${activeColumn.bg} overflow-hidden`}>
              <ColumnHeader col={activeColumn} count={columnOrders.length} />
              <div className="p-2 space-y-2">
                {columnOrders.length === 0 ? (
                  <EmptyColumn col={activeColumn} />
                ) : (
                  columnOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Order Modal ── */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default SellerOrders;