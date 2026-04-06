import { ArrowUpRight, Landmark, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PAYOUT_CONFIG } from '../constants/walletConstants';
import { formatCurrency, formatTitleCase } from '../../../utils/formatters';
import {
  RiderPrimaryButton,
  RiderSecondaryButton,
  RiderStatusBadge,
  RiderTextInput,
} from './ui/RiderPrimitives';

const WithdrawMoneyPanel = ({
  walletInfo,
  bankDetails,
  bankSummary,
  withdrawalWindow,
  availableAmount,
  pendingAmount,
  pendingPayout,
  withdrawalAmount,
  onWithdrawalAmountChange,
  withdrawDisabledReason,
  submitting,
  onWithdraw,
}) => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="rounded-[28px] border border-primary/15 bg-primary p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">
              <WalletCards size={14} className="text-white" />
              Available to withdraw
            </p>
            <p className="mt-3 text-3xl font-bold sm:text-4xl">{formatCurrency(availableAmount)}</p>
            <p className="mt-2 text-sm text-white/80">This is the money you can send to your bank now.</p>
          </div>
          {pendingPayout ? (
            <RiderStatusBadge status="pending">{formatTitleCase(pendingPayout.status)}</RiderStatusBadge>
          ) : null}
        </div>
      </div>

      <div className="rounded-[24px] border border-gray-200 bg-white p-4 sm:p-5">
        <p className="text-sm font-semibold text-dark">How much do you want to withdraw?</p>
        <div className="mt-4 space-y-4">
          <RiderTextInput
            type="number"
            min={PAYOUT_CONFIG.MINIMUM_AMOUNT}
            step="100"
            value={withdrawalAmount}
            onChange={(event) => onWithdrawalAmountChange(event.target.value)}
            placeholder={`Enter amount e.g. ${PAYOUT_CONFIG.MINIMUM_AMOUNT}`}
          />

          <div className="flex flex-wrap gap-2">
            {[PAYOUT_CONFIG.MINIMUM_AMOUNT, availableAmount]
              .filter((amount, index, array) => amount > 0 && array.indexOf(amount) === index)
              .map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => onWithdrawalAmountChange(String(Math.floor(amount)))}
                  className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                >
                  {amount === availableAmount ? 'Withdraw all' : `Use ${formatCurrency(amount)}`}
                </button>
              ))}
          </div>

          {withdrawDisabledReason ? (
            <p className="text-sm text-[#b24d00]">{withdrawDisabledReason}</p>
          ) : pendingAmount > 0 ? (
            <p className="text-sm text-muted">
              {formatCurrency(pendingAmount)} is still pending and cannot be withdrawn yet.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary">
            <Landmark size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-dark">{bankDetails ? 'Bank account' : 'Add a bank account'}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{bankSummary}</p>
            <div className="mt-3 space-y-1 text-sm text-muted">
              <p>Minimum withdrawal: {formatCurrency(PAYOUT_CONFIG.MINIMUM_AMOUNT)}</p>
              {withdrawalWindow?.next_window_start ? (
                <p>
                  Next window:{' '}
                  {new Date(withdrawalWindow.next_window_start).toLocaleString('en-NG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <RiderSecondaryButton
          onClick={() => navigate('/rider/verification-bank')}
          className="mt-4 sm:w-auto sm:px-5"
          icon={<ArrowUpRight size={16} />}
        >
          {bankDetails ? 'Update bank details' : 'Add bank details'}
        </RiderSecondaryButton>
      </div>

      <RiderPrimaryButton
        onClick={onWithdraw}
        loading={submitting}
        disabled={Boolean(withdrawDisabledReason)}
        className="w-full bg-[#FF6B00] hover:bg-[#e56000]"
      >
        Withdraw money
      </RiderPrimaryButton>
    </div>
  );
};

export default WithdrawMoneyPanel;
