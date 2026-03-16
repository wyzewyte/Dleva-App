/**
 * DeliveryActions Component
 * Handles delivery action buttons and state transitions
 */

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, XCircle, Camera, MessageSquare } from 'lucide-react';
import MESSAGES from '../../../constants/messages';
import { DELIVERY_STATUSES, VALIDATION_RULES } from '../constants/deliveryConstants';

const DeliveryActions = ({
  delivery,
  onMarkOnTheWay,
  onAttemptDelivery,
  onCompleteDelivery,
  onCancelDelivery,
  isLoading,
  onPhotoCapture,
}) => {
  const [showAttemptForm, setShowAttemptForm] = useState(false);
  const [attemptReason, setAttemptReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showProofForm, setShowProofForm] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState('');
  const [proofNotes, setProofNotes] = useState('');

  if (!delivery) return null;

  const status = delivery.status;

  // Determine which actions are available based on status
  const canMarkOnTheWay = status === DELIVERY_STATUSES.PICKED_UP;
  const canAttemptDelivery = [DELIVERY_STATUSES.ON_THE_WAY, DELIVERY_STATUSES.DELIVERY_ATTEMPTED].includes(status);
  const canCompleteDelivery = [DELIVERY_STATUSES.ON_THE_WAY, DELIVERY_STATUSES.DELIVERY_ATTEMPTED].includes(status);
  const canCancelDelivery = ![DELIVERY_STATUSES.DELIVERED, DELIVERY_STATUSES.CANCELLED].includes(status);

  const handleMarkOnTheWay = async () => {
    try {
      await onMarkOnTheWay?.();
    } catch (error) {
      console.error('Failed to mark on the way:', error);
    }
  };

  const handleAttemptDelivery = async () => {
    try {
      await onAttemptDelivery?.(attemptReason);
      setShowAttemptForm(false);
      setAttemptReason('');
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }
  };

  const handleCompleteDelivery = async (proofPhoto) => {
    try {
      if (!deliveryPin.trim()) {
        alert('Delivery PIN is required');
        return;
      }
      await onCompleteDelivery?.(deliveryPin, proofPhoto, proofNotes);
      setShowProofForm(false);
      setDeliveryPin('');
      setProofNotes('');
    } catch (error) {
      console.error('Failed to complete delivery:', error);
    }
  };

  const handleCancelDelivery = async () => {
    if (!window.confirm('Are you sure you want to cancel this delivery?')) {
      return;
    }
    try {
      await onCancelDelivery?.(cancelReason);
      setShowCancelForm(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel delivery:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mark on the way */}
      {canMarkOnTheWay && (
        <button
          onClick={handleMarkOnTheWay}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <MessageSquare size={18} />
              <span>On The Way</span>
            </>
          )}
        </button>
      )}

      {/* Delivery Attempt */}
      {canAttemptDelivery && (
        <>
          {!showAttemptForm ? (
            <button
              onClick={() => setShowAttemptForm(true)}
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <AlertCircle size={18} />
              <span>Delivery Issue</span>
            </button>
          ) : (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 space-y-3">
              <p className="font-bold text-dark">What's the issue?</p>
              <textarea
                value={attemptReason}
                onChange={e => setAttemptReason(e.target.value)}
                placeholder="e.g., Customer not home, wrong address, etc."
                maxLength={VALIDATION_RULES.REASON_MAX_LENGTH}
                className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAttemptForm(false)}
                  className="flex-1 px-3 py-2 border-2 border-orange-200 text-orange-600 font-bold rounded-lg hover:bg-orange-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttemptDelivery}
                  disabled={isLoading || !attemptReason.trim()}
                  className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
                >
                  {isLoading ? 'Saving...' : 'Submit Report'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Complete Delivery */}
      {canCompleteDelivery && (
        <>
          {!showProofForm ? (
            <button
              onClick={() => setShowProofForm(true)}
              disabled={isLoading}
              className="w-full bg-success hover:bg-success/90 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <CheckCircle2 size={18} />
              <span>Complete Delivery</span>
            </button>
          ) : (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
              <p className="font-bold text-dark">Complete Delivery</p>

              {/* Delivery PIN */}
              <div>
                <label className="block text-sm font-bold text-dark mb-2">
                  Delivery PIN (from customer) *
                </label>
                <input
                  type="text"
                  value={deliveryPin}
                  onChange={e => setDeliveryPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-success text-sm"
                />
              </div>

              {/* Photo Upload */}
              <div className="border-2 border-dashed border-green-200 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="proof-photo"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      onPhotoCapture?.(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="proof-photo"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Camera size={32} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">Upload or Take Photo</span>
                  <span className="text-xs text-green-600">Proof of delivery (optional)</span>
                </label>
              </div>

              {/* Notes */}
              <textarea
                value={proofNotes}
                onChange={e => setProofNotes(e.target.value)}
                placeholder="Add any delivery notes (optional)"
                maxLength={VALIDATION_RULES.NOTES_MAX_LENGTH}
                className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-success text-sm"
                rows={2}
              />

              {/* Confirmation Checklist */}
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-dark">Customer received order</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-dark">Payment confirmed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-dark">Customer satisfied</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProofForm(false)}
                  className="flex-1 px-3 py-2 border-2 border-green-200 text-green-600 font-bold rounded-lg hover:bg-green-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCompleteDelivery(null)}
                  disabled={isLoading || !deliveryPin.trim()}
                  className="flex-1 px-3 py-2 bg-success hover:bg-success/90 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
                >
                  {isLoading ? 'Completing...' : 'Complete'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Cancel Delivery */}
      {canCancelDelivery && (
        <>
          {!showCancelForm ? (
            <button
              onClick={() => setShowCancelForm(true)}
              disabled={isLoading}
              className="w-full bg-danger hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm"
            >
              <XCircle size={16} className="inline mr-1" />
              Cancel Delivery
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 space-y-2">
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling?"
                maxLength={150}
                className="w-full px-2 py-1.5 border border-red-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={2}
              />
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setShowCancelForm(false)}
                  className="flex-1 px-2 py-1.5 border border-red-200 text-red-600 font-bold rounded hover:bg-red-50"
                >
                  Keep Delivery
                </button>
                <button
                  onClick={handleCancelDelivery}
                  disabled={isLoading}
                  className="flex-1 px-2 py-1.5 bg-danger text-white font-bold rounded"
                >
                  {isLoading ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delivery Complete */}
      {status === DELIVERY_STATUSES.DELIVERED && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
          <CheckCircle2 size={32} className="text-green-600 mx-auto mb-2" />
          <p className="font-bold text-dark text-lg">Delivery Completed!</p>
          <p className="text-sm text-green-600 mt-1">Thank you for your delivery</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryActions;
