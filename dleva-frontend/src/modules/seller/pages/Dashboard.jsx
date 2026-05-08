import { Clock3, DollarSign, ShoppingBag, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import sellerAnalytics from '../../../services/sellerAnalytics';
import sellerStore from '../../../services/sellerStore';
import { logError } from '../../../utils/errorHandler';
import { formatCurrency } from '../../../utils/formatters';
import { SellerActionTile, SellerSectionIntro, SellerSummaryCard } from '../components/SellerShared';
import SellerPageLoading from '../components/ui/SellerPageLoading';
import {
  SellerCard,
  SellerFeedbackState,
  SellerPageHeader,
  SellerPrimaryButton,
  SellerStatusBadge,
} from '../components/ui/SellerPrimitives';

const SellerDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsData, storeData] = await Promise.all([
          sellerAnalytics.getAnalytics(),
          sellerStore.getStoreStatus(),
        ]);
        setAnalytics(analyticsData);
        setStoreStatus(storeData);
        setError(null);
      } catch (err) {
        logError(err, { context: 'SellerDashboard.fetchData' });
        setError(err.error || 'Failed to load seller dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleStoreStatusChanged = (event) => {
      const nextStatus = Boolean(event.detail?.is_active);
      setStoreStatus((previous) => (previous ? { ...previous, is_active: nextStatus } : previous));
    };

    window.addEventListener('seller-store-status-changed', handleStoreStatusChanged);
    return () => window.removeEventListener('seller-store-status-changed', handleStoreStatusChanged);
  }, []);

  const handleStoreToggle = async () => {
    if (!storeStatus || togglingStore) return;

    try {
      setTogglingStore(true);
      const nextStatus = !storeStatus.is_active;
      await sellerStore.updateStoreStatus(nextStatus);
      setStoreStatus((previous) => ({ ...previous, is_active: nextStatus }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('seller-store-status-changed', {
            detail: { is_active: nextStatus },
          })
        );
      }
    } catch (err) {
      logError(err, { context: 'SellerDashboard.handleStoreToggle' });
      setError(err.error || 'Failed to update store status');
    } finally {
      setTogglingStore(false);
    }
  };

  const quickMetrics = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(Number(analytics.total_earnings || 0)),
        icon: DollarSign,
        accent: 'bg-emerald-500',
      },
      {
        title: 'Active Orders',
        value: `${analytics.total_orders || 0}`,
        icon: ShoppingBag,
        accent: 'bg-accent',
      },
      {
        title: 'Completed Orders',
        value: `${analytics.completed_orders || 0}`,
        icon: Clock3,
        accent: 'bg-amber-500',
      },
      {
        title: 'Repeat Customers',
        value: `${analytics.repeat_customers || 0}`,
        icon: TrendingUp,
        accent: 'bg-violet-500',
      },
    ];
  }, [analytics]);

  if (loading) {
    return <SellerPageLoading variant="dashboard" />;
  }

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Seller workspace"
        title="Dashboard"
        action={
          <div className="hidden sm:block">
            <SellerPrimaryButton className="sm:w-auto" onClick={handleStoreToggle} loading={togglingStore}>
              {storeStatus?.is_active ? 'Pause Store' : 'Open Store'}
            </SellerPrimaryButton>
          </div>
        }
      />

      {error ? <SellerFeedbackState type="error" title="Something went wrong" message={error} /> : null}

      <SellerCard className="p-5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/80">Store overview</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight text-dark">
              {analytics?.restaurant_name || storeStatus?.name || 'Your store'}
            </h2>
            <SellerStatusBadge status={storeStatus?.is_active ? 'open' : 'closed'} className="flex-shrink-0">
              {storeStatus?.is_active ? 'Store Open' : 'Store Closed'}
            </SellerStatusBadge>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickMetrics.map((metric) => (
            <SellerSummaryCard key={metric.title} {...metric} className="border-0 border-b border-gray-100 shadow-none" />
          ))}
        </div>
      </SellerCard>

      <SellerCard className="p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Today's Performance</p>
          <div className="mt-4">
            <p className="text-4xl font-bold text-dark">{formatCurrency(Number(analytics?.today?.earnings || 0))}</p>
            <p className="mt-1 text-sm text-gray-600">in earnings</p>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-2xl font-bold text-dark">{analytics?.today?.orders || 0}</p>
            <p className="mt-1 text-sm text-gray-600">orders today</p>
          </div>
        </div>
      </SellerCard>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SellerCard className="p-5 sm:p-6">
          <SellerSectionIntro title="Top selling items" />
          {analytics?.top_selling_items?.length ? (
            <div className="mt-5 space-y-3">
              {analytics.top_selling_items.map((item, index) => (
                <div key={`${item.menu_item__name}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-[#fbfbfa] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-dark">{item.menu_item__name}</p>
                  </div>
                  <SellerStatusBadge status="active">{item.total_sold} sold</SellerStatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <SellerFeedbackState
              type="info"
              title="No top items yet"
              message="As orders come in, your highest-performing menu items will appear here."
              className="mt-5"
            />
          )}
        </SellerCard>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight text-dark px-1">Quick actions</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SellerActionTile
            to="/seller/orders"
            title="Manage active orders"
            icon={ShoppingBag}
            badge={`${analytics?.total_orders || 0} active`}
          />
          <SellerActionTile
            to="/seller/menu"
            title="Update menu"
            icon={UtensilsCrossed}
          />
          <SellerActionTile
            to="/seller/history"
            title="Review sales history"
            icon={TrendingUp}
          />
        </div>
      </section>
    </div>
  );
};

export default SellerDashboard;
