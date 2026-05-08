import { Bike, CheckCircle2, ChefHat, Clock3, Package, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import sellerOrders from '../../../services/sellerOrders';
import { logError } from '../../../utils/errorHandler';
import { cn } from '../../../utils/cn';
import OrderCard from '../components/OrderCard';
import OrderModal from '../components/OrderModal';
import SellerPageLoading from '../components/ui/SellerPageLoading';
import { SellerCard, SellerEmptyState, SellerFeedbackState, SellerQuietButton, SellerStatusBadge } from '../components/ui/SellerPrimitives';

const COLUMNS = [
  {
    id: 'new',
    label: 'New orders',
    shortLabel: 'New',
    icon: Clock3,
    tone: 'border-primary/25 bg-primary/10 text-primary',
    activeTone: 'bg-primary text-white shadow-sm',
    columnTone: 'border-primary/15',
    statuses: ['pending'],
  },
  {
    id: 'preparing',
    label: 'Cooking',
    shortLabel: 'Cooking',
    icon: ChefHat,
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    activeTone: 'bg-amber-500 text-white shadow-sm',
    columnTone: 'border-amber-100',
    statuses: ['confirming', 'preparing'],
  },
  {
    id: 'ready',
    label: 'Ready for pickup',
    shortLabel: 'Ready',
    icon: Package,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    activeTone: 'bg-emerald-600 text-white shadow-sm',
    columnTone: 'border-emerald-100',
    statuses: ['available_for_pickup', 'awaiting_rider', 'assigned', 'arrived_at_pickup'],
  },
  {
    id: 'rider_en_route',
    label: 'On the way',
    shortLabel: 'On the way',
    icon: Bike,
    tone: 'border-accent-light bg-accent-light text-accent',
    activeTone: 'bg-accent text-white shadow-sm',
    columnTone: 'border-sky-100',
    statuses: ['picked_up'],
  },
  {
    id: 'history',
    label: 'Delivered',
    shortLabel: 'Delivered',
    icon: CheckCircle2,
    tone: 'border-gray-200 bg-gray-50 text-gray-700',
    activeTone: 'bg-dark text-white shadow-sm',
    columnTone: 'border-gray-200',
    statuses: ['delivered', 'cancelled'],
  },
];

const ACTION_STATUSES = ['pending', 'confirming', 'preparing', 'arrived_at_pickup'];
const READY_STATUSES = ['available_for_pickup', 'awaiting_rider', 'assigned', 'arrived_at_pickup'];

const OrderFilterTabs = ({ columns, activeTab, onChange, getCount }) => {
  const topRow = columns.slice(0, 3);
  const bottomRow = columns.slice(3);

  const renderRow = (items) => (
    <div className="grid grid-cols-3 gap-0">
      {items.map((column) => {
        const count = getCount(column);
        const isActive = activeTab === column.id;

        return (
          <button
            key={column.id}
            type="button"
            onClick={() => onChange(column.id)}
            className={cn(
              'inline-flex min-h-[46px] items-center justify-center gap-1.5 border-b px-2 py-3 text-sm font-semibold leading-none transition-colors',
              isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-dark'
            )}
          >
            <span>{column.shortLabel}</span>
            <span className={cn('text-[11px] font-bold', isActive ? 'text-primary' : 'text-gray-400')}>{count}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="border-b border-gray-200">
      {renderRow(topRow)}
      <div className="grid grid-cols-2 gap-0">
        {bottomRow.map((column) => {
          const count = getCount(column);
          const isActive = activeTab === column.id;

          return (
            <button
              key={column.id}
              type="button"
              onClick={() => onChange(column.id)}
              className={cn(
                'inline-flex min-h-[46px] items-center justify-center gap-1.5 border-b px-2 py-3 text-sm font-semibold leading-none transition-colors',
                isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-dark'
              )}
            >
              <span>{column.shortLabel}</span>
              <span className={cn('text-[11px] font-bold', isActive ? 'text-primary' : 'text-gray-400')}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const formatRefreshAge = (value) => {
  if (!value) return 'Waiting for first sync';
  if (Number.isNaN(value.getTime())) return 'Waiting for first sync';

  const diffMs = Date.now() - value.getTime();
  if (diffMs < 60000) return 'Updated just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `Updated ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Updated ${days}d ago`;

  return `Updated ${value.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}`;
};

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('new');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { orders: nextOrders, serverTime } = await sellerOrders.getOrders();
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setLastUpdated(serverTime ? new Date(serverTime) : null);
      setError(null);
    } catch (err) {
      logError(err, { context: 'SellerOrders.fetchOrders' });
      setError(err.error || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      setUpdatingOrderId(orderId);
      await sellerOrders.updateOrderStatus(orderId, newStatus);
      setOrders((previous) => previous.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
      setError(null);
      return true;
    } catch (err) {
      const fullMessage = err?.details?.message || err?.details?.reason || err?.error || err?.message || 'Failed to update order status';
      setError(fullMessage);
      await fetchOrders(true);
      return false;
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const getColumnOrders = useCallback((column) => safeOrders.filter((order) => column.statuses.includes(order.status)), [safeOrders]);
  const activeColumn = COLUMNS.find((column) => column.id === activeTab);
  const totalActive = useMemo(() => safeOrders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length, [safeOrders]);
  const needsActionCount = useMemo(() => safeOrders.filter((order) => ACTION_STATUSES.includes(order.status)).length, [safeOrders]);
  const readyCount = useMemo(() => safeOrders.filter((order) => READY_STATUSES.includes(order.status)).length, [safeOrders]);
  const activeColumnOrders = activeColumn ? getColumnOrders(activeColumn) : [];
  const safeActiveColumnOrders = Array.isArray(activeColumnOrders) ? activeColumnOrders : [];
  const ActiveColumnIcon = activeColumn?.icon || Clock3;

  if (loading) {
    return <SellerPageLoading variant="orders" />;
  }

  return (
    <div className="space-y-6">
      {error ? <SellerFeedbackState type="error" title="Order update issue" message={error} /> : null}

      <SellerCard className="border-gray-100 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">Live kitchen queue</p>
              <SellerStatusBadge status={needsActionCount > 0 ? 'pending' : 'active'}>
                {needsActionCount > 0 ? `${needsActionCount} need action` : 'Clear'}
              </SellerStatusBadge>
            </div>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-dark sm:text-3xl">
              {totalActive} active order{totalActive === 1 ? '' : 's'}
            </h2>
            <p className="mt-1 text-sm text-muted">{formatRefreshAge(lastUpdated)}</p>
          </div>
          <SellerQuietButton
            className="shrink-0 border border-gray-200 bg-white px-3"
            onClick={handleRefresh}
            icon={<RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
          >
            Refresh
          </SellerQuietButton>
        </div>
      </SellerCard>

      <div className="sticky top-[72px] z-20 -mx-4 bg-white/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 xl:static xl:mx-0 xl:bg-transparent xl:px-0 xl:py-0 xl:backdrop-blur-0">
        <SellerCard className="overflow-hidden px-3 pt-2">
          <OrderFilterTabs
            columns={COLUMNS}
            activeTab={activeTab}
            onChange={setActiveTab}
            getCount={(column) => getColumnOrders(column).length}
          />
        </SellerCard>
      </div>

      <div className="hidden gap-4 xl:grid xl:grid-cols-5">
        {COLUMNS.map((column) => {
          const columnOrders = getColumnOrders(column);
          const Icon = column.icon;
          return (
            <SellerCard key={column.id} className={cn('overflow-hidden border bg-white', column.columnTone)}>
              <div className="border-b border-gray-100 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border', column.tone)}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-dark">{column.label}</p>
                      <p className="mt-0.5 text-xs text-muted">{columnOrders.length} order{columnOrders.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <SellerStatusBadge>{columnOrders.length}</SellerStatusBadge>
                </div>
              </div>
              <div className="space-y-3 bg-[#fbfbfa] p-3">
                {columnOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-muted">No orders here.</div>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      compact
                      isUpdating={updatingOrderId === order.id}
                      onStatusChange={handleStatusChange}
                      onViewDetails={(item) => {
                        setSelectedOrder(item);
                        setIsModalOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </SellerCard>
          );
        })}
      </div>

      <div className="xl:hidden">
        {activeColumn ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-base font-bold text-dark">{activeColumn.label}</p>
                <p className="mt-0.5 text-sm text-muted">{safeActiveColumnOrders.length} order{safeActiveColumnOrders.length === 1 ? '' : 's'}</p>
              </div>
              <SellerStatusBadge>{safeActiveColumnOrders.length}</SellerStatusBadge>
            </div>

            {safeActiveColumnOrders.length === 0 ? (
              <SellerEmptyState
                icon={<ActiveColumnIcon size={24} />}
                title="No orders here"
                description="New activity will appear in this stage as orders move."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {safeActiveColumnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isUpdating={updatingOrderId === order.id}
                    onStatusChange={handleStatusChange}
                    onViewDetails={(item) => {
                      setSelectedOrder(item);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        isUpdating={Boolean(selectedOrder && updatingOrderId === selectedOrder.id)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default SellerOrders;
