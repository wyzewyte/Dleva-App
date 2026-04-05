import { useEffect, useState } from 'react';
import { ArrowUpRight, CircleDollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import riderWallet from '../services/riderWallet';
import { formatCurrency } from '../../../utils/formatters';
import {
  RiderCard,
  RiderFeedbackState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSecondaryButton,
} from '../components/ui/RiderPrimitives';

const Earnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [transactions, setTransactions] = useState([]);

  const loadEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const [today, weekly, fullSummary, transactionHistory] = await Promise.all([
        riderWallet.getEarningsToday(),
        riderWallet.getEarningsWeekly(),
        riderWallet.getEarningsSummary(),
        riderWallet.getTransactionHistory(1, 10),
      ]);

      setSummary({
        today: parseFloat(today?.earnings?.total_earned || today?.earnings?.amount || 0),
        week: parseFloat(weekly?.earnings?.total_earnings || 0),
        month: parseFloat(fullSummary?.summary?.this_month_earnings || 0),
        total: parseFloat(fullSummary?.summary?.total_earnings || 0),
      });
      setTransactions(transactionHistory?.transactions || []);
    } catch (loadError) {
      setError(loadError?.error || 'Unable to load rider earnings right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings().catch(() => {});
  }, []);

  return (
    <RiderPageShell maxWidth="max-w-5xl">
      <RiderPageHeader
        title="Earnings"
        subtitle="Keep payouts and delivery income understandable at a glance, without turning the rider app into a finance dashboard."
        sticky
      />

      <div className="space-y-6 py-6">
        {loading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <RiderCard key={item} className="p-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-9 w-28 animate-pulse rounded-xl bg-gray-100" />
                </RiderCard>
              ))}
            </div>

            <RiderCard className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-10 w-32 animate-pulse rounded-xl bg-gray-100" />
              </div>

              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4">
                    <div className="space-y-2">
                      <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            </RiderCard>
          </>
        ) : error ? (
          <RiderFeedbackState
            type="error"
            title="Unable to load earnings"
            message={error}
            action={
              <RiderPrimaryButton onClick={() => loadEarnings()} className="sm:w-auto sm:px-5">
                Try again
              </RiderPrimaryButton>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Today', summary.today],
                ['This week', summary.week],
                ['This month', summary.month],
                ['All time', summary.total],
              ].map(([label, value]) => (
                <RiderCard key={label} className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
                  <p className="mt-3 text-3xl font-bold text-dark">{formatCurrency(value)}</p>
                </RiderCard>
              ))}
            </div>

            <RiderCard className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-dark">Recent transactions</h2>
                  <p className="text-sm text-muted">The latest credits and payout movements from your rider wallet.</p>
                </div>
                <RiderSecondaryButton onClick={() => navigate('/rider/earnings')} className="w-auto px-4" icon={<ArrowUpRight size={16} />}>
                  Earnings details
                </RiderSecondaryButton>
              </div>

              <div className="mt-5 space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <div key={transaction.id || index} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-dark">{transaction.description || 'Delivery payment'}</p>
                        <p className="mt-1 text-xs text-muted">
                          {transaction.created_at
                            ? new Date(transaction.created_at).toLocaleString()
                            : 'Recent'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-dark">
                          {transaction.type === 'credit' ? '+' : '-'}
                          {formatCurrency(transaction.amount || 0)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">{transaction.status || 'processed'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-muted">
                    No transactions yet. Completed deliveries will start appearing here.
                  </div>
                )}
              </div>
            </RiderCard>

            <RiderCard className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <CircleDollarSign size={20} className="mt-0.5 text-primary" />
                <div>
                  <h3 className="text-base font-bold text-dark">What this page is for</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Riders mainly need a quick answer to three questions: how much they earned today, what is available for payout,
                    and what recently changed in the wallet. This view keeps those answers close and avoids extra complexity.
                  </p>
                </div>
              </div>
            </RiderCard>
          </>
        )}
      </div>
    </RiderPageShell>
  );
};

export default Earnings;
