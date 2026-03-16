/**
 * DisputeForm Component
 * Form for lodging disputes on orders
 */

import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import riderWallet from '../services/riderWallet';
import MESSAGES from '../../../constants/messages';

const DISPUTE_REASONS = [
  'Order not delivered',
  'Items missing from order',
  'Items damaged or incorrect',
  'Rider did not arrive',
  'Wrong address delivered to',
  'Payment issue',
  'Other',
];

const DisputeForm = ({ orderId, onSuccess, onCancel }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please select a dispute reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await riderWallet.lodgeDispute(orderId, reason, description);
      onSuccess?.();
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex gap-3">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold mb-1">Dispute Information</p>
          <p className="text-xs">Our team will review your dispute and contact you within 24 hours</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dispute Reason */}
        <div>
          <label className="block text-sm font-bold text-dark mb-2">
            Dispute Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">Select a reason...</option>
            {DISPUTE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-dark mb-2">
            Additional Details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened..."
            maxLength={300}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            rows={4}
          />
          <p className="text-xs text-muted mt-1">
            {description.length}/300 characters
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border-2 border-gray-200 text-dark font-bold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Submitting...' : 'Lodge Dispute'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DisputeForm;
