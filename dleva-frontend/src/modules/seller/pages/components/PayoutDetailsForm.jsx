import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import OptionSelect from '../../../../components/ui/OptionSelect';
import paystackBanking from '../../../../services/paystackBanking';

const ACCOUNT_NUMBER_LENGTH = 10;

const PayoutDetailsForm = ({ payoutData, loading, onSave }) => {
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState('');
  const [formData, setFormData] = useState({
    bankCode: payoutData?.bank_code || '',
    bankName: payoutData?.bank_name || '',
    accountNumber: payoutData?.account_number || '',
    accountName: payoutData?.verified ? payoutData?.account_name || '' : '',
  });
  const [resolveState, setResolveState] = useState({ loading: false, error: '', resolved: null });
  const [errors, setErrors] = useState({});

  const loadBanks = useCallback(async () => {
    setBanksLoading(true);
    setBanksError('');
    try {
      const result = await paystackBanking.listBanks();
      setBanks(result);
    } catch (error) {
      setBanksError(error?.error || 'Unable to load banks right now.');
    } finally {
      setBanksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanks().catch(() => {});
  }, [loadBanks]);

  const resolveAccount = useCallback(async (bankCode, accountNumber) => {
    setResolveState({ loading: true, error: '', resolved: null });
    try {
      const resolved = await paystackBanking.resolveAccount(bankCode, accountNumber);
      setResolveState({ loading: false, error: '', resolved });
      setFormData((current) => ({
        ...current,
        bankName: resolved.bank_name,
        accountName: resolved.account_name,
      }));
    } catch (error) {
      setResolveState({ loading: false, error: error?.error || 'Unable to validate bank account.', resolved: null });
      setFormData((current) => ({ ...current, accountName: '' }));
    }
  }, []);

  useEffect(() => {
    if (!formData.bankCode || formData.accountNumber.length !== ACCOUNT_NUMBER_LENGTH) {
      setResolveState((current) => ({
        ...current,
        loading: false,
        error: '',
        resolved: null,
      }));
      if (!payoutData?.verified) {
        setFormData((current) => ({ ...current, accountName: '' }));
      }
      return undefined;
    }

    const timer = window.setTimeout(() => {
      resolveAccount(formData.bankCode, formData.accountNumber).catch(() => {});
    }, 450);

    return () => window.clearTimeout(timer);
  }, [payoutData?.verified, formData.accountNumber, formData.bankCode, resolveAccount]);

  const selectedBank = useMemo(
    () => banks.find((bank) => String(bank.code) === String(formData.bankCode)) || null,
    [banks, formData.bankCode]
  );

  const bankOptions = useMemo(
    () => banks.map((bank) => ({ value: bank.code, label: bank.name })),
    [banks]
  );

  const canSave = Boolean(resolveState.resolved && !resolveState.loading && !loading);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      const next = {
        ...current,
        [name]: name === 'accountNumber' ? value.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH) : value,
      };

      if (name === 'bankCode') {
        const bank = banks.find((item) => String(item.code) === String(value));
        next.bankName = bank?.name || '';
        next.accountName = '';
      }

      if (name === 'accountNumber') {
        next.accountName = '';
      }

      return next;
    });

    setResolveState({ loading: false, error: '', resolved: null });
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.bankCode) nextErrors.bankCode = 'Select a bank.';
    if (!/^\d{10}$/.test(formData.accountNumber)) nextErrors.accountNumber = 'Enter a valid 10-digit account number.';
    if (!resolveState.resolved) nextErrors.accountName = 'Resolve the account before saving.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm() || !resolveState.resolved) return;
    await onSave({
      bankCode: resolveState.resolved.bank_code,
      bankName: resolveState.resolved.bank_name,
      accountNumber: resolveState.resolved.account_number,
      accountName: resolveState.resolved.account_name,
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Bank</label>
        <OptionSelect
          value={formData.bankCode}
          options={bankOptions}
          onChange={(value) => handleChange({ target: { name: 'bankCode', value } })}
          disabled={banksLoading}
          error={Boolean(errors.bankCode)}
          placeholder={banksLoading ? 'Loading banks...' : 'Select a bank'}
          emptyText={banksLoading ? 'Loading banks...' : 'No banks available'}
          searchable={!banksLoading}
          searchPlaceholder="Search your bank"
        />
        {banksError ? <p className="mt-1 text-xs font-medium text-red-600">{banksError}</p> : null}
        {banksError ? (
          <button
            type="button"
            onClick={() => loadBanks().catch(() => {})}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:opacity-80"
          >
            <RefreshCw size={12} />
            Retry bank list
          </button>
        ) : null}
        {errors.bankCode ? <p className="mt-1 text-xs font-medium text-red-600">{errors.bankCode}</p> : null}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Account number</label>
        <input
          type="text"
          name="accountNumber"
          inputMode="numeric"
          value={formData.accountNumber}
          onChange={handleChange}
          placeholder="0123456789"
          className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-3 font-mono text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.accountNumber ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
        />
        {errors.accountNumber ? <p className="mt-1 text-xs font-medium text-red-600">{errors.accountNumber}</p> : null}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Account holder name</label>
        <input
          type="text"
          value={formData.accountName}
          readOnly
          placeholder={resolveState.loading ? 'Resolving account...' : 'Account name will appear after validation'}
          className="mt-1 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600"
        />
        {errors.accountName ? <p className="mt-1 text-xs font-medium text-red-600">{errors.accountName}</p> : null}
      </div>

      {resolveState.loading ? (
        <div className="flex gap-2 rounded-xl border border-accent-light bg-accent-light p-3 text-sm text-accent">
          <Loader2 size={16} className="mt-0.5 animate-spin shrink-0" />
          <p>Validating bank account...</p>
        </div>
      ) : null}

      {resolveState.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <div className="flex gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{resolveState.error}</p>
          </div>
          {formData.bankCode && formData.accountNumber.length === ACCOUNT_NUMBER_LENGTH ? (
            <button
              type="button"
              onClick={() => resolveAccount(formData.bankCode, formData.accountNumber).catch(() => {})}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 transition-colors hover:opacity-80"
            >
              <RefreshCw size={12} />
              Retry validation
            </button>
          ) : null}
        </div>
      ) : null}

      {resolveState.resolved ? (
        <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            Verified account for <span className="font-semibold">{resolveState.resolved.account_name}</span>
            {selectedBank?.name ? ` at ${selectedBank.name}` : ''}.
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSave}
        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
      >
        {loading ? 'Saving...' : 'Save payout details'}
      </button>
    </form>
  );
};

export default PayoutDetailsForm;
