import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import sellerHistory from '../../../services/sellerHistory';
import { logError } from '../../../utils/errorHandler';
import { formatCurrency } from '../../../utils/formatters';
import OptionSelect from '../../../components/ui/OptionSelect';
import SellerPageLoading from '../components/ui/SellerPageLoading';
import {
  SellerCard,
  SellerEmptyState,
  SellerFeedbackState,
  SellerPageHeader,
  SellerPrimaryButton,
  SellerStatusBadge,
} from '../components/ui/SellerPrimitives';

const REVENUE_PERIOD_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '24_hours', label: '24h' },
  { value: '7_days', label: '7 days' },
  { value: '30_days', label: '30 days' },
  { value: 'custom', label: 'Custom' },
];

const statusLabel = (status) =>
  ({
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    picked_up: 'Picked Up',
    on_the_way: 'On the Way',
    confirming: 'Confirming',
    preparing: 'Preparing',
  }[status] || status?.replace(/_/g, ' ') || 'Unknown');

const HistoryFilterTabs = ({ tabs, value, onChange }) => (
  <div className="border-b border-gray-200">
    <div className="flex items-end">
      {tabs.map((tab) => {
        const isActive = tab.id === value;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 border-b px-2 py-3 text-center text-sm font-semibold leading-none transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-dark'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateLabel = (value) => {
  const date = parseDateValue(value);
  if (!date) return '';
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
};

const CalendarRangePicker = ({ startDate, endDate, onSelectDate }) => {
  const initialDate = parseDateValue(startDate) || parseDateValue(endDate) || new Date();
  const [visibleMonth, setVisibleMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const monthLabel = visibleMonth.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
  const todayValue = formatDateValue(new Date());
  const firstDayOffset = visibleMonth.getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1)),
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white hover:text-dark"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-bold text-dark">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white hover:text-dark"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-400">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {calendarCells.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} className="h-9" />;
          }

          const value = formatDateValue(date);
          const start = parseDateValue(startDate);
          const end = parseDateValue(endDate);
          const selected = value === startDate || value === endDate;
          const inRange = start && end && date > start && date < end;
          const isToday = value === todayValue;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelectDate(value)}
              className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
                selected
                  ? 'bg-primary text-white shadow-sm'
                  : inRange
                    ? 'bg-primary/10 text-primary'
                    : isToday
                      ? 'bg-white text-primary ring-1 ring-primary/30'
                      : 'text-dark hover:bg-white'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CustomDateRangeDropdown = ({ startDate, endDate, onApply }) => {
  const [open, setOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const containerRef = useRef(null);

  useEffect(() => {
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
  }, [endDate, startDate]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const label = startDate && endDate ? `${startDate} - ${endDate}` : 'Choose dates';
  const canApply = Boolean(draftStartDate && draftEndDate);
  const handleSelectDate = (value) => {
    if (!draftStartDate || draftEndDate) {
      setDraftStartDate(value);
      setDraftEndDate('');
      return;
    }

    if (parseDateValue(value) < parseDateValue(draftStartDate)) {
      setDraftStartDate(value);
      setDraftEndDate('');
      return;
    }

    setDraftEndDate(value);
  };

  return (
    <div ref={containerRef} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[46px] w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-left text-sm text-dark transition-colors hover:bg-gray-100"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Calendar size={16} className="shrink-0 text-primary" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Start</p>
                <p className="mt-1 text-sm font-bold text-dark">{formatDateLabel(draftStartDate) || 'Select'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">End</p>
                <p className="mt-1 text-sm font-bold text-dark">{formatDateLabel(draftEndDate) || 'Select'}</p>
              </div>
            </div>

            <CalendarRangePicker
              startDate={draftStartDate}
              endDate={draftEndDate}
              onSelectDate={handleSelectDate}
            />

            <button
              type="button"
              disabled={!canApply}
              onClick={() => {
                onApply(draftStartDate, draftEndDate);
                setOpen(false);
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply dates
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SellerHistory = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleRevenuePeriodClick = (period) => {
    setRevenuePeriod((current) => (current === period ? 'all' : period));
  };

  const dateFilterParams = useMemo(() => {
    const params = { period: revenuePeriod };

    if (revenuePeriod === 'custom') {
      params.start_date = customStartDate;
      params.end_date = customEndDate;
    }

    return params;
  }, [customEndDate, customStartDate, revenuePeriod]);

  const fetchData = useCallback(async () => {
    if (revenuePeriod === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }

    try {
      setLoading(true);
      const [ordersData, payoutsData] = await Promise.all([
        sellerHistory.getOrderHistory(dateFilterParams),
        sellerHistory.getPayouts(dateFilterParams),
      ]);
      setOrders(ordersData);
      setPayouts(payoutsData);
      setError(null);
    } catch (err) {
      logError(err, { context: 'SellerHistory.fetchData' });
      setError(err.error || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [customEndDate, customStartDate, dateFilterParams, revenuePeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formattedOrders = useMemo(
    () =>
      orders.map((order) => {
        return {
          ...order,
          dateLabel: new Date(order.created_at).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          customerLabel: order.customer_name || order.buyer || 'Unknown customer',
          itemSummary: order.items?.map((item) => `${item.quantity}x ${item.menu_item}`).join(', ') || 'No items recorded',
          foodTotal: Number(order.restaurant_earnings ?? 0),
        };
      }),
    [orders]
  );

  const filteredOrders = useMemo(
    () =>
      formattedOrders.filter((order) => {
        const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;
        return matchesStatus;
      }),
    [filterStatus, formattedOrders]
  );

  const totalEarnings = formattedOrders
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + Number(order.foodTotal || 0), 0);

  const exportCSV = () => {
    const rows =
      activeTab === 'orders'
        ? filteredOrders.map((order) =>
            `${order.id},"${order.dateLabel}","${order.customerLabel}","${order.itemSummary}",${order.foodTotal},${order.status}`
          )
        : payouts.map((payout) =>
            `${payout.id},"${new Date(payout.date).toLocaleDateString('en-NG')}","${payout.bank}",${payout.amount},${payout.status}`
          );

    const header =
      activeTab === 'orders'
        ? 'Order ID,Date,Customer,Items,Total,Status'
        : 'Payout ID,Date,Bank,Amount,Status';

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = activeTab === 'orders' ? 'seller-sales-history.csv' : 'seller-payout-history.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'orders', label: 'Order history' },
    { id: 'payouts', label: 'Payouts' },
  ];

  if (loading) {
    return <SellerPageLoading variant="history" />;
  }

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-6">
      <SellerPageHeader
        eyebrow="Seller finance"
        title="History"
        className="py-4 sm:py-5"
        action={
          <div className="hidden sm:block">
            <SellerPrimaryButton className="sm:w-auto" onClick={exportCSV} icon={<Download size={16} />}>
              Export CSV
            </SellerPrimaryButton>
          </div>
        }
      />

      {error ? <SellerFeedbackState type="error" title="Could not load history" message={error} /> : null}

      {!error ? (
        <>
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {REVENUE_PERIOD_OPTIONS.map((option) => {
                const isActive = revenuePeriod === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleRevenuePeriodClick(option.value)}
                    className={`min-h-9 shrink-0 rounded-full px-3.5 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-muted hover:bg-gray-50 hover:text-dark'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {revenuePeriod === 'custom' ? (
              <CustomDateRangeDropdown
                startDate={customStartDate}
                endDate={customEndDate}
                onApply={(startDate, endDate) => {
                  setCustomStartDate(startDate);
                  setCustomEndDate(endDate);
                }}
              />
            ) : null}

            <SellerCard className="border-primary bg-primary p-5 text-white">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">
                <Wallet size={14} className="text-white" />
                Delivered revenue
              </p>
              <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">{formatCurrency(totalEarnings)}</p>
              <p className="mt-2 text-sm text-white/80">Revenue from delivered orders.</p>
              <button
                type="button"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/90 sm:w-auto sm:min-w-[180px]"
              >
                Withdraw money
              </button>
            </SellerCard>
          </div>

          <div className="xl:hidden">
            <SellerCard className="overflow-hidden p-4">
              <HistoryFilterTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
            </SellerCard>
          </div>

          <div className="hidden xl:block">
            <SellerCard className="border-b border-gray-200 p-4">
              <HistoryFilterTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
            </SellerCard>
          </div>

          {activeTab === 'orders' ? (
            <div className="relative lg:w-48">
              <OptionSelect
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="All statuses"
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'picked_up', label: 'Picked up' },
                  { value: 'preparing', label: 'Preparing' },
                ]}
              />
            </div>
          ) : null}

          {activeTab === 'orders' ? (
            filteredOrders.length === 0 ? (
              <SellerEmptyState
                icon={<Calendar size={24} />}
                title="No order history found"
                description="Completed sales will appear here once orders start moving through your kitchen."
              />
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <SellerCard key={order.id} className="p-4 sm:p-5">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-dark">Order #{order.id}</p>
                          <p className="mt-1 text-xs text-muted">{order.dateLabel}</p>
                        </div>
                        <SellerStatusBadge status={order.status}>{statusLabel(order.status)}</SellerStatusBadge>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">{order.customerLabel}</p>
                        <p className="mt-1 text-sm text-muted line-clamp-2">{order.itemSummary}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-base font-bold text-dark">{formatCurrency(order.foodTotal)}</span>
                      </div>
                    </div>
                  </SellerCard>
                ))}
              </div>
            )
          ) : payouts.length === 0 ? (
            <SellerEmptyState
              icon={<Wallet size={24} />}
              title="No payouts yet"
              description="Once transfers begin processing, your payout trail will appear here."
            />
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <SellerCard key={payout.id} className="p-4 sm:p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-dark">Payout #{payout.id}</p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(payout.date).toLocaleDateString('en-NG')} to {payout.bank}
                        </p>
                      </div>
                      <SellerStatusBadge status={payout.status}>{statusLabel(payout.status)}</SellerStatusBadge>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-base font-bold text-dark">{formatCurrency(Number(payout.amount || 0))}</span>
                    </div>
                  </div>
                </SellerCard>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default SellerHistory;
