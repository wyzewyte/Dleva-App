/**
 * Earnings Page
 * Displays earnings overview and transaction history
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, TrendingDown, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EarningsSummary from '../components/EarningsSummary';
import riderWallet from '../services/riderWallet';
import { formatCurrency } from '../../../utils/formatters';
import MESSAGES from '../../../constants/messages';
import { PAYOUT_CONFIG } from '../constants/walletConstants';

const Earnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [allTimeEarnings, setAllTimeEarnings] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [today, weekly, summary, trans] = await Promise.all([
        riderWallet.getEarningsToday(),
        riderWallet.getEarningsWeekly(),
        riderWallet.getEarningsSummary(),
        riderWallet.getTransactionHistory(1, 10),
      ]);

      // Extract correct fields from backend response
      setTodayEarnings(
        parseFloat(today.earnings?.total_earned || 0)
      );
      setWeeklyEarnings(
        parseFloat(weekly.earnings?.total_earnings || 0)
      );
      setMonthlyEarnings(
        parseFloat(summary.summary?.this_month_earnings || 0)
      );
      setAllTimeEarnings(
        parseFloat(summary.summary?.total_earnings || 0)
      );
      setTransactions(trans.transactions || []);
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-dark text-base sm:text-lg">Earnings</h1>
            <p className="text-xs text-muted">Track your delivery earnings</p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8 pb-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg text-sm">
            {error}
            <button
              onClick={fetchEarningsData}
              className="ml-2 sm:ml-3 text-red-800 font-bold hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="animate-spin text-primary flex-shrink-0" />
            <span className="text-muted font-medium text-sm">Loading earnings...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary Cards */}
            <section>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3 sm:mb-4">
                Earnings Overview
              </h2>
              <EarningsSummary
                today={todayEarnings}
                weekly={weeklyEarnings}
                monthly={monthlyEarnings}
                allTime={allTimeEarnings}
                loading={loading}
              />
            </section>

            {/* Recent Transactions */}
            <section>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3 sm:mb-4">
                Recent Transactions
              </h2>

              {transactions.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center space-y-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto text-gray-300">
                    <DollarSign size={48} />
                  </div>
                  <p className="text-muted font-medium text-sm sm:text-base">No transactions yet</p>
                  <p className="text-xs text-muted">
                    Complete deliveries to earn money
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {transactions.map((txn, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-dark truncate">
                          {txn.description || 'Delivery Payment'}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(txn.created_at).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <p
                          className={`font-bold text-sm sm:text-base ${
                            txn.type === 'credit'
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >
                          {txn.type === 'credit' ? '+' : '-'}
                          {formatCurrency(txn.amount)}
                        </p>
                        <p className="text-xs text-muted capitalize">
                          {txn.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Earnings Breakdown Info */}
            <section className="bg-primary/5 border border-primary/10 rounded-lg sm:rounded-2xl p-4 sm:p-6 space-y-3">
              <h3 className="font-bold text-dark text-xs sm:text-sm uppercase tracking-wide">
                How Earnings Work
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-dark">
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>Earn money for each successful delivery completion</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>Earnings are calculated based on distance and delivery time</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>
                    Minimum withdrawal amount is {PAYOUT_CONFIG.CURRENCY}
                    {PAYOUT_CONFIG.MINIMUM_AMOUNT.toLocaleString()}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">•</span>
                  <span>Payouts are processed within 24-48 business hours</span>
                </li>
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Earnings;
