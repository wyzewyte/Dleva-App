/**
 * PayoutHistory Page
 * Displays payout history and allows requesting new payouts
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, DollarSign, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PayoutCard from '../components/PayoutCard';
import riderWallet from '../services/riderWallet';
import { formatCurrency } from '../../../utils/formatters';
import MESSAGES from '../../../constants/messages';
import {
  PAYOUT_CONFIG,
  PAYOUT_ERRORS,
  WALLET_SUCCESS,
} from '../constants/walletConstants';

const PayoutHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [payoutData, walletData] = await Promise.all([
        riderWallet.getPayoutHistory(1, 20),
        riderWallet.getWalletInfo(),
      ]);

      setPayouts(payoutData.payouts || []);
      setWallet(walletData.wallet || walletData);
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();

    if (!requestAmount || isNaN(requestAmount) || requestAmount < PAYOUT_CONFIG.MINIMUM_AMOUNT) {
      alert(`Minimum payout is ${PAYOUT_CONFIG.CURRENCY}${PAYOUT_CONFIG.MINIMUM_AMOUNT.toLocaleString()}`);
      return;
    }

    if (requestAmount > (wallet?.available_balance || 0)) {
      alert(MESSAGES.ERROR.INSUFFICIENT_BALANCE || 'Insufficient balance');
      return;
    }

    try {
      setRequesting(true);
      setError(null);

      await riderWallet.requestPayout(parseFloat(requestAmount), 1); // TODO: handle bank account selection

      alert(WALLET_SUCCESS.PAYOUT_REQUESTED);
      setShowRequestForm(false);
      setRequestAmount('');
      await fetchPayoutData();
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-dark text-lg">Payouts</h1>
            <p className="text-xs text-muted">Manage your withdrawals</p>
          </div>
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Request Payout
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={fetchPayoutData}
              className="ml-3 text-red-800 font-bold hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Request Payout Form */}
        {showRequestForm && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-dark">Request Payout</h3>

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm text-dark space-y-1">
              <p>
                <span className="font-bold">Available Balance:</span>{' '}
                {formatCurrency(wallet?.available_balance || 0)}
              </p>
              <p className="text-xs text-muted">
                Minimum withdrawal: {PAYOUT_CONFIG.CURRENCY}
                {PAYOUT_CONFIG.MINIMUM_AMOUNT.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Amount ({PAYOUT_CONFIG.CURRENCY}) *
                </label>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={PAYOUT_CONFIG.MINIMUM_AMOUNT}
                  step="100"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setRequestAmount('');
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-dark font-bold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting || !requestAmount}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  {requesting && <Loader2 size={16} className="animate-spin" />}
                  {requesting ? 'Processing...' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-muted font-medium">Loading payouts...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Wallet Info */}
            {wallet && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-success/10 border border-success/20 rounded-2xl p-5 space-y-2">
                  <p className="text-xs text-muted font-bold uppercase">Available Balance</p>
                  <h3 className="text-2xl font-bold text-dark">
                    {formatCurrency(wallet.available_balance || 0)}
                  </h3>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 space-y-2">
                  <p className="text-xs text-muted font-bold uppercase">Pending Balance</p>
                  <h3 className="text-2xl font-bold text-dark">
                    {formatCurrency(wallet.pending_balance || 0)}
                  </h3>
                </div>
              </div>
            )}

            {/* Payout History */}
            <section>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-4">
                Payout History
              </h2>

              {payouts.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center space-y-3">
                  <DollarSign size={32} className="mx-auto text-gray-300" />
                  <p className="text-muted font-medium">No payouts yet</p>
                  <p className="text-xs text-muted">
                    Request your first payout to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payouts.map((payout, idx) => (
                    <PayoutCard key={idx} payout={payout} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default PayoutHistory;
