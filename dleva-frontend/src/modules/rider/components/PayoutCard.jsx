/**
 * PayoutCard Component
 * Displays individual payout record
 */

import { Calendar, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const statusConfig = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    icon: Clock,
    label: 'Pending',
  },
  processing: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Clock,
    label: 'Processing',
  },
  completed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: CheckCircle2,
    label: 'Completed',
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: AlertCircle,
    label: 'Failed',
  },
  cancelled: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: AlertCircle,
    label: 'Cancelled',
  },
};

const PayoutCard = ({ payout }) => {
  const config = statusConfig[payout.status] || statusConfig.pending;
  const Icon = config.icon;

  const requestDate = new Date(payout.requested_at).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const completedDate = payout.completed_at
    ? new Date(payout.completed_at).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className={`${config.bg} border-2 ${config.border} rounded-lg p-4 space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={18} className="text-primary" />
            <h4 className="text-lg font-bold text-dark">
              {formatCurrency(payout.amount)}
            </h4>
          </div>
          <p className={`text-xs font-bold ${config.text} flex items-center gap-1`}>
            <Icon size={14} />
            {config.label}
          </p>
        </div>

        <div className="text-right space-y-1">
          <p className="text-xs text-muted font-bold">Request Date</p>
          <p className="text-sm font-bold text-dark">{requestDate}</p>
        </div>
      </div>

      {/* Bank Info */}
      {(payout.bank_name || payout.account_name) && (
        <div className="bg-white/50 rounded-lg p-2 text-xs space-y-1">
          {payout.bank_name && (
            <p className="text-muted">
              <span className="font-bold">Bank:</span> {payout.bank_name}
            </p>
          )}
          {payout.account_name && (
            <p className="text-muted">
              <span className="font-bold">Account:</span> {payout.account_name}
            </p>
          )}
        </div>
      )}

      {/* Completion Date (if applicable) */}
      {completedDate && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Calendar size={14} />
          <span>
            <span className="font-bold">Completed:</span> {completedDate}
          </span>
        </div>
      )}

      {/* Failure Reason (if applicable) */}
      {payout.rejection_reason && (
        <div className="bg-red-100 border border-red-200 rounded text-xs text-red-700 p-2">
          <p className="font-bold">Rejection Reason:</p>
          <p>{payout.rejection_reason}</p>
        </div>
      )}
    </div>
  );
};

export default PayoutCard;
