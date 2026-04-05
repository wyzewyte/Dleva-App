import { useEffect, useState } from 'react';
import { AlertCircle, Banknote, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaystackBankAccountForm from '../../../components/payments/PaystackBankAccountForm';
import {
  RiderCard,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderStatusBadge,
} from '../components/ui/RiderPrimitives';
import riderVerification from '../services/riderVerification';

const BankDetailsVerification = () => {
  const navigate = useNavigate();
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadBankDetails = async () => {
      try {
        setLoading(true);
        const result = await riderVerification.getBankDetails();
        setBankDetails(result || null);
      } catch (err) {
        if (err?.status !== 404) {
          setError(err?.error || 'Unable to load bank details right now.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadBankDetails().catch(() => {});
  }, []);

  const handleSave = async (payload) => {
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const result = await riderVerification.addBankDetails(payload);
      setBankDetails(result);
      setSuccess('Bank details verified and saved successfully.');
    } catch (err) {
      setError(err?.error || 'Unable to save bank details right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RiderPageShell maxWidth="max-w-3xl" withBottomNavSpacing={false}>
      <RiderPageHeader
        title="Bank details"
        subtitle="Add the payout account that receives rider earnings. We validate the account with Paystack before saving."
        showBack
        onBack={() => navigate('/rider/verification-setup')}
        sticky
      />

      <div className="space-y-6 py-6">
        <RiderCard className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Banknote size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-dark">Payout account</h2>
                <RiderStatusBadge status={bankDetails?.verified ? 'approved' : 'pending'}>
                  {bankDetails?.verified ? 'Verified' : 'Needed'}
                </RiderStatusBadge>
              </div>
              <p className="mt-2 text-sm text-muted">
                Keep one valid bank account here for rider payouts. Duplicate bank accounts are blocked across riders.
              </p>
            </div>
          </div>
        </RiderCard>

        {error ? (
          <RiderCard className="border-red-100 bg-red-50 p-4">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </RiderCard>
        ) : null}

        {success ? (
          <RiderCard className="border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3 text-emerald-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          </RiderCard>
        ) : null}

        <RiderCard className="p-5 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
              <div className="h-12 w-48 animate-pulse rounded-xl bg-gray-100" />
            </div>
          ) : (
            <PaystackBankAccountForm
              bankDetails={bankDetails}
              onSave={handleSave}
              loading={saving}
              title="Verify bank account"
              description="Choose a bank, enter the account number, and save only after the account name has been confirmed."
              saveLabel="Save verified bank details"
            />
          )}
        </RiderCard>

        <div className="flex justify-end">
          <RiderPrimaryButton className="sm:w-auto sm:px-6" onClick={() => navigate('/rider/verification-setup')}>
            Back to verification setup
          </RiderPrimaryButton>
        </div>
      </div>
    </RiderPageShell>
  );
};

export default BankDetailsVerification;
