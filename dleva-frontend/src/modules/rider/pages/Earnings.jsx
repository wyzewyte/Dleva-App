import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleDollarSign,
  ChevronRight,
  Clock3,
  RefreshCw,
  WalletCards,
  X,
} from 'lucide-react';
import riderWallet from '../services/riderWallet';
import riderVerification from '../services/riderVerification';
import { PAYOUT_CONFIG } from '../constants/walletConstants';
import { formatCurrency, formatTitleCase } from '../../../utils/formatters';
import {
  RiderCard,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSecondaryButton,
  RiderSegmentedTabs,
} from '../components/ui/RiderPrimitives';
import PayoutCard from '../components/PayoutCard';
import RiderRangeFilter from '../components/ui/RiderRangeFilter';
import WithdrawMoneyPanel from '../components/WithdrawMoneyPanel';

const HISTORY_TABS = [
  { id: 'activity', label: 'Activity' },
  { id: 'payouts', label: 'Payouts' },
];

const HISTORY_FILTER_OPTIONS = [
  { value: 'day', label: 'Today' },
  { value: '24_hours', label: 'Last 24 hours' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 1 month' },
  { value: '3_months', label: 'Last 3 months' },
  { value: '6_months', label: 'Last 6 months' },
  { value: '12_months', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom period' },
];

const toAmount = (...values) => {
  for (const value of values) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const toList = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
};

const WalletModal = ({ open, title, subtitle, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full w-full flex-col">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-dark sm:text-2xl">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-dark transition-colors hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-8 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </div>
      </div>
    </div>
  );
};

const WalletActionRow = ({ icon, title, subtitle, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 border-b border-gray-100 px-1 py-4 text-left transition-colors last:border-b-0 hover:bg-gray-50/70"
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-primary">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-base font-semibold text-dark">{title}</p>
      {subtitle ? <p className="mt-0.5 text-sm leading-5 text-muted">{subtitle}</p> : null}
    </div>
    {badge ? (
      <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        {badge}
      </div>
    ) : null}
    <ChevronRight size={18} className="shrink-0 text-muted" />
  </button>
);

const Earnings = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [historyFilter, setHistoryFilter] = useState('day');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [summary, setSummary] = useState({
    available: 0,
    pending: 0,
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const loadWallet = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const [walletRes, todayRes, weeklyRes, summaryRes, transactionRes, payoutRes, bankRes] = await Promise.allSettled([
        riderWallet.getWalletInfo(),
        riderWallet.getEarningsToday(),
        riderWallet.getEarningsWeekly(),
        riderWallet.getEarningsSummary(),
        riderWallet.getTransactionHistory({
          page: 1,
          limit: 10,
          period: historyFilter,
          startDate: historyStartDate,
          endDate: historyEndDate,
        }),
        riderWallet.getPayoutHistory({
          page: 1,
          limit: 10,
          period: historyFilter,
          startDate: historyStartDate,
          endDate: historyEndDate,
        }),
        riderVerification.getBankDetails(),
      ]);

      const firstError = [walletRes, todayRes, weeklyRes, summaryRes, transactionRes, payoutRes]
        .find((result) => result.status === 'rejected');

      if (firstError?.status === 'rejected') {
        throw firstError.reason;
      }

      const walletData = walletRes.status === 'fulfilled' ? walletRes.value : null;
      const todayData = todayRes.status === 'fulfilled' ? todayRes.value : null;
      const weeklyData = weeklyRes.status === 'fulfilled' ? weeklyRes.value : null;
      const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
      const transactionData = transactionRes.status === 'fulfilled' ? transactionRes.value : null;
      const payoutData = payoutRes.status === 'fulfilled' ? payoutRes.value : null;

      setWalletInfo(walletData?.wallet || null);
      setBankDetails(bankRes.status === 'fulfilled' ? bankRes.value : null);
      setSummary({
        available: toAmount(
          walletData?.wallet?.available_balance,
          summaryData?.summary?.current_available
        ),
        pending: toAmount(
          walletData?.wallet?.pending_balance,
          summaryData?.summary?.current_pending
        ),
        today: toAmount(todayData?.earnings?.total_earned, todayData?.earnings?.amount),
        week: toAmount(weeklyData?.earnings?.total_earnings, weeklyData?.summary?.weekly_earnings),
        month: toAmount(summaryData?.summary?.this_month_earnings, summaryData?.this_month_earnings),
        total: toAmount(summaryData?.summary?.total_earnings, summaryData?.total_earnings),
      });
      setTransactions(
        toList(
          transactionData?.transactions,
          transactionData?.results,
          transactionData?.history
        )
      );
      setPayouts(
        toList(
          payoutData?.payouts,
          payoutData?.results,
          payoutData?.history
        )
      );
    } catch (loadError) {
      setError(loadError?.error || 'Unable to load rider wallet right now.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [historyEndDate, historyFilter, historyStartDate]);

  useEffect(() => {
    if (historyFilter === 'custom' && (!historyStartDate || !historyEndDate)) return;
    loadWallet().catch(() => {});
  }, [loadWallet, historyEndDate, historyFilter, historyStartDate]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const withdrawalWindow = walletInfo?.withdrawal_window || null;
  const backendWithdrawalBlockers = useMemo(
    () => walletInfo?.withdrawal_blockers || [],
    [walletInfo?.withdrawal_blockers]
  );
  const pendingPayout = useMemo(
    () => walletInfo?.active_payout || null,
    [walletInfo?.active_payout]
  );
  const numericWithdrawalAmount = useMemo(() => {
    const cleaned = String(withdrawalAmount || '').replace(/[^\d.]/g, '');
    return Number.parseFloat(cleaned) || 0;
  }, [withdrawalAmount]);

  const withdrawDisabledReason = useMemo(() => {
    if (!numericWithdrawalAmount) return 'Enter how much you want to withdraw.';
    if (numericWithdrawalAmount < PAYOUT_CONFIG.MINIMUM_AMOUNT) {
      return `Minimum withdrawal is ${formatCurrency(PAYOUT_CONFIG.MINIMUM_AMOUNT)}.`;
    }
    if (numericWithdrawalAmount > summary.available) {
      return 'Amount is higher than your available wallet balance.';
    }
    if (backendWithdrawalBlockers.length > 0) return backendWithdrawalBlockers[0];
    return '';
  }, [backendWithdrawalBlockers, numericWithdrawalAmount, summary.available]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWallet({ silent: true });
  };

  const handleWithdraw = async () => {
    if (withdrawDisabledReason) {
      setNotice({ type: 'error', message: withdrawDisabledReason });
      return;
    }

    try {
      setSubmitting(true);
      setNotice(null);
      await riderWallet.requestPayout(numericWithdrawalAmount);
      setWithdrawalAmount('');
      setNotice({
        type: 'success',
        message: `Withdrawal request submitted for ${formatCurrency(numericWithdrawalAmount)}.`,
      });
      await loadWallet({ silent: true });
    } catch (withdrawError) {
      setNotice({
        type: 'error',
        message: withdrawError?.error || 'Unable to submit your withdrawal request right now.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const bankSummary = bankDetails
    ? [
        bankDetails?.bank_name,
        bankDetails?.account_name,
        bankDetails?.account_number_masked || bankDetails?.account_number,
      ]
        .filter(Boolean)
        .join(' - ')
    : 'No payout bank account saved yet';

  return (
    <RiderPageShell maxWidth="max-w-6xl">
      <RiderPageHeader
        title="Wallet"
        subtitle="See your money, request payouts, and track payment updates in one place."
        sticky
        action={
          <RiderSecondaryButton
            onClick={handleRefresh}
            className="w-auto px-4"
            icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
          >
            Refresh
          </RiderSecondaryButton>
        }
      />

      <div className="space-y-6 py-6">
        {notice ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              notice.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        {loading ? (
          <>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <RiderCard key={item} className="p-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-9 w-28 animate-pulse rounded-xl bg-gray-100" />
                  <div className="mt-3 h-4 w-24 animate-pulse rounded bg-gray-100" />
                </RiderCard>
              ))}
            </div>

            <RiderCard className="p-5 sm:p-6">
              <div className="space-y-3">
                <div className="h-6 w-36 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
              </div>
            </RiderCard>
          </>
        ) : error ? (
          <RiderFeedbackState
            type="error"
            title="Unable to load wallet"
            message={error}
            action={
              <RiderPrimaryButton onClick={() => loadWallet()} className="sm:w-auto sm:px-5">
                Try again
              </RiderPrimaryButton>
            }
          />
        ) : (
          <>
            <div className="space-y-4">
              <RiderCard className="border-primary bg-primary p-5 text-white">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">
                  <WalletCards size={14} className="text-white" />
                  Available
                </p>
                <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">{formatCurrency(summary.available)}</p>
                <p className="mt-2 text-sm text-white/80">Money you can withdraw now.</p>
                <button
                  type="button"
                  onClick={() => setActiveModal('withdraw')}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/90 sm:w-auto sm:min-w-[180px]"
                >
                  Withdraw money
                </button>
              </RiderCard>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: 'Pending',
                    value: summary.pending,
                    icon: Clock3,
                    tone: 'text-amber-600',
                    description: 'Money still waiting to clear.',
                  },
                  {
                    label: 'Today',
                    value: summary.today,
                    icon: CircleDollarSign,
                    tone: 'text-primary',
                    description: 'What you earned today.',
                  },
                ].map((item) => (
                  <RiderCard key={item.label} className="p-5">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
                      <item.icon size={14} className={item.tone} />
                      {item.label}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-dark sm:text-3xl">{formatCurrency(item.value)}</p>
                    <p className="mt-2 text-xs text-muted">{item.description}</p>
                  </RiderCard>
                ))}
              </div>
            </div>

              <RiderCard className="px-4 py-1 sm:px-5 sm:py-1">
                <WalletActionRow
                  icon={<Clock3 size={18} />}
                  title="Payout timeline"
                  onClick={() => setActiveModal('timeline')}
                />
            </RiderCard>

              <RiderCard className="p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-dark">Wallet history</h2>
                  </div>
                  <RiderSegmentedTabs tabs={HISTORY_TABS} value={activeTab} onChange={setActiveTab} className="w-full sm:w-auto" />
                </div>

                <RiderRangeFilter
                  value={historyFilter}
                  options={HISTORY_FILTER_OPTIONS}
                  onChange={setHistoryFilter}
                  showCustomInputs={historyFilter === 'custom'}
                  startDate={historyStartDate}
                  endDate={historyEndDate}
                  onStartDateChange={setHistoryStartDate}
                  onEndDateChange={setHistoryEndDate}
                  className="max-w-[180px]"
                />
              </div>

              <div className="mt-5">
                {activeTab === 'activity' ? (
                  transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((transaction, index) => {
                        const type = String(transaction?.type || transaction?.transaction_type || 'activity').toLowerCase();
                        const amount = toAmount(transaction?.amount, transaction?.net_amount, transaction?.value);
                        const isDebit = ['withdrawal', 'debit'].includes(type) || amount < 0;
                        return (
                          <div key={transaction?.id || `${type}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 p-4">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dark">
                                {transaction?.description || formatTitleCase(type) || 'Wallet activity'}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {transaction?.created_at
                                  ? new Date(transaction.created_at).toLocaleString('en-NG', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })
                                  : 'Recent'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${isDebit ? 'text-red-600' : 'text-emerald-700'}`}>
                                {isDebit ? '-' : '+'}
                                {formatCurrency(Math.abs(amount))}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                                {formatTitleCase(transaction?.status || 'processed')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-muted">
                      No wallet activity yet. Your earnings and withdrawals will show here.
                    </div>
                  )
                ) : payouts.length > 0 ? (
                  <div className="space-y-3">
                    {payouts.map((payout, index) => (
                      <PayoutCard key={payout?.id || payout?.reference || index} payout={payout} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-muted">
                    No payout requests yet. Your payout updates will show here.
                  </div>
                )}
              </div>
            </RiderCard>
          </>
        )}
      </div>

      <WalletModal
        open={activeModal === 'withdraw'}
        title="Withdraw money"
        subtitle="Review your payout details and request a withdrawal here."
        onClose={() => setActiveModal(null)}
      >
        <WithdrawMoneyPanel
          walletInfo={walletInfo}
          bankDetails={bankDetails}
          bankSummary={bankSummary}
          withdrawalWindow={withdrawalWindow}
          availableAmount={summary.available}
          pendingAmount={summary.pending}
          pendingPayout={pendingPayout}
          withdrawalAmount={withdrawalAmount}
          onWithdrawalAmountChange={setWithdrawalAmount}
          withdrawDisabledReason={withdrawDisabledReason}
          submitting={submitting}
          onWithdraw={handleWithdraw}
        />
      </WalletModal>

      <WalletModal
        open={activeModal === 'timeline'}
        title="Payout timeline"
        subtitle="See what happens after you request a payout."
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          {[
            {
              title: '1. Request during the open window',
              body: 'Withdrawals only work during the open payout window.',
            },
            {
              title: '2. Earnings move from pending to available',
              body: 'New earnings wait in pending before you can withdraw them.',
            },
            {
              title: '3. Backend verifies wallet and bank details',
              body: 'We check your wallet rules and saved bank account before payout.',
            },
            {
              title: '4. Track the status in payout history',
              body: 'You can follow every payout update below.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-dark">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </WalletModal>
    </RiderPageShell>
  );
};

export default Earnings;
