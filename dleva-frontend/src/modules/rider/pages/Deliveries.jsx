import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CircleDollarSign,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useOrder } from '../context/OrderContext';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import riderWallet from '../services/riderWallet';
import toast from '../../../services/toast';
import { formatCurrency } from '../../../utils/formatters';
import RiderRangeFilter from '../components/ui/RiderRangeFilter';
import {
  RiderCard,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderQuietButton,
} from '../components/ui/RiderPrimitives';

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 1 month' },
  { value: '3_months', label: 'Last 3 months' },
  { value: '6_months', label: 'Last 6 months' },
  { value: '12_months', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom period' },
];

const Deliveries = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const { activeOrders, error, actions } = useOrder();
  const [refreshing, setRefreshing] = React.useState(false);
  const [earningsToday, setEarningsToday] = React.useState(0);
  const [deliveriesToday, setDeliveriesToday] = React.useState(0);
  const [earningsLoading, setEarningsLoading] = React.useState(false);
  const [statsPeriod, setStatsPeriod] = React.useState('day');
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');
  const [statsError, setStatsError] = React.useState('');

  const periodLabel = React.useMemo(() => {
    return PERIOD_OPTIONS.find((option) => option.value === statsPeriod)?.label || 'Selected period';
  }, [statsPeriod]);

  useOrderWebSocket({
    autoConnect: true,
    autoRefreshNewOrder: true,
    autoRefreshStatusUpdate: true,
    onNewOrder: (data) => {
      toast.success(`New order from ${data.restaurant_name || 'restaurant'} is ready.`);
    },
  });

  const loadDashboard = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks = [actions.fetchActiveOrders()];
      if (rider?.can_go_online) {
        tasks.push(actions.fetchAvailableOrders());
      }
      await Promise.all(tasks);

      setEarningsLoading(true);
      try {
        if (statsPeriod === 'custom' && (!customStartDate || !customEndDate)) {
          setEarningsToday(0);
          setDeliveriesToday(0);
          setStatsError('Select both a start date and an end date for a custom period.');
          return;
        }

        const stats = await riderWallet.getDeliveryStats({
          period: statsPeriod,
          startDate: customStartDate,
          endDate: customEndDate,
        });
        setEarningsToday(parseFloat(stats?.stats?.total_earned || 0));
        setDeliveriesToday(Number(stats?.stats?.deliveries || 0));
        setStatsError('');
      } catch (statsFetchError) {
        setEarningsToday(0);
        setDeliveriesToday(0);
        setStatsError(statsFetchError?.error || 'Unable to load filtered delivery stats.');
      } finally {
        setEarningsLoading(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, [actions, customEndDate, customStartDate, rider?.can_go_online, statsPeriod]);

  React.useEffect(() => {
    if (rider) {
      loadDashboard().catch(() => {});
    }
  }, [loadDashboard, rider]);

  return (
    <RiderPageShell maxWidth="max-w-6xl">
      <RiderPageHeader
        title="Deliveries"
        subtitle="Your rider day starts here. Check what needs attention, then move straight into the next task."
        sticky
        action={
          <RiderQuietButton onClick={() => loadDashboard()} icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}>
            Refresh
          </RiderQuietButton>
        }
      />

      <div className="space-y-6 py-6">
        {!rider?.can_go_online ? (
          <RiderCard className="border-amber-100 bg-amber-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800">Verification is still blocking work</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  Complete the remaining setup steps so you can go online and start receiving orders.
                </p>
              </div>
              <RiderPrimaryButton onClick={() => navigate('/rider/verification-setup')} className="w-full sm:w-auto sm:px-5">
                Finish verification
              </RiderPrimaryButton>
            </div>
          </RiderCard>
        ) : null}

        <RiderRangeFilter
          value={statsPeriod}
          options={PERIOD_OPTIONS}
          onChange={setStatsPeriod}
          showCustomInputs={statsPeriod === 'custom'}
          startDate={customStartDate}
          endDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
        />

        {error ? (
          <RiderFeedbackState
            type="error"
            title="We could not refresh your rider data"
            message={error}
            action={
              <RiderPrimaryButton onClick={() => loadDashboard()} className="sm:w-auto sm:px-5">
                Try again
              </RiderPrimaryButton>
            }
          />
        ) : null}

        {statsError ? (
          <RiderFeedbackState
            type="error"
            title="We could not refresh filtered delivery stats"
            message={statsError}
            action={
              <RiderPrimaryButton onClick={() => loadDashboard()} className="sm:w-auto sm:px-5">
                Retry stats
              </RiderPrimaryButton>
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RiderCard className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              <Truck size={14} className="text-primary" />
              Active deliveries
            </p>
            <p className="mt-2 text-[2rem] font-bold leading-none text-dark">{activeOrders.length}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {activeOrders.length > 0 ? 'Needs attention first.' : 'No active work right now.'}
            </p>
          </RiderCard>

          <RiderCard className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              <ClipboardList size={14} className="text-primary" />
              Total deliveries
            </p>
            <p className="mt-2 text-[2rem] font-bold leading-none text-dark">
              {earningsLoading ? '...' : deliveriesToday}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Completed deliveries.</p>
          </RiderCard>

          <RiderCard className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              <CircleDollarSign size={14} className="text-primary" />
              Period earnings
            </p>
            <p className="mt-2 text-[2rem] font-bold leading-none text-dark">
              {earningsLoading ? '...' : formatCurrency(earningsToday)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Backend earnings for {periodLabel.toLowerCase()}.</p>
          </RiderCard>
        </div>

      </div>
    </RiderPageShell>
  );
};

export default Deliveries;
