import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import OptionSelect from '../ui/OptionSelect';
import paystackBanking from '../../services/paystackBanking';

const ACCOUNT_NUMBER_LENGTH = 10;

const PaystackBankAccountForm = ({
  bankDetails,
  onSave,
  loading,
  title = 'Bank details',
  description = 'Choose a bank, enter the account number, and we will verify it with Paystack before saving.',
  saveLabel = 'Save verified bank details',
}) => {
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState('');
  const [formData, setFormData] = useState({
    bank_code: bankDetails?.bank_code || '',
    bank_name: bankDetails?.bank_name || '',
    account_name: bankDetails?.verified ? bankDetails?.account_name || '' : '',
    account_number: '',
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
        bank_name: resolved.bank_name,
        account_name: resolved.account_name,
      }));
    } catch (error) {
      setResolveState({ loading: false, error: error?.error || 'Unable to validate bank account.', resolved: null });
      setFormData((current) => ({ ...current, account_name: '' }));
    }
  }, []);

  useEffect(() => {
    if (!formData.bank_code || formData.account_number.length !== ACCOUNT_NUMBER_LENGTH) {
      setResolveState((current) => ({
        ...current,
        loading: false,
        error: '',
        resolved: null,
      }));
      if (!bankDetails?.verified) {
        setFormData((current) => ({ ...current, account_name: '' }));
      }
      return undefined;
    }

    const timer = window.setTimeout(() => {
      resolveAccount(formData.bank_code, formData.account_number).catch(() => {});
    }, 450);

    return () => window.clearTimeout(timer);
  }, [bankDetails?.verified, formData.account_number, formData.bank_code, resolveAccount]);

  const selectedBank = useMemo(
    () => banks.find((bank) => String(bank.code) === String(formData.bank_code)) || null,
    [banks, formData.bank_code]
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
        [name]: name === 'account_number' ? value.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH) : value,
      };

      if (name === 'bank_code') {
        const bank = banks.find((item) => String(item.code) === String(value));
        next.bank_name = bank?.name || '';
        next.account_name = '';
      }

      if (name === 'account_number') {
        next.account_name = '';
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
    if (!formData.bank_code) nextErrors.bank_code = 'Select a bank.';
    if (!/^\d{10}$/.test(formData.account_number)) nextErrors.account_number = 'Enter a valid 10-digit account number.';
    if (!resolveState.resolved) nextErrors.account_name = 'Resolve the account before saving.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateForm() || !resolveState.resolved) return;
    await onSave({
      bank_code: resolveState.resolved.bank_code,
      bank_name: resolveState.resolved.bank_name,
      account_number: resolveState.resolved.account_number,
      account_name: resolveState.resolved.account_name,
    });
  };

  return (
    <div className="space-y-6">
      {bankDetails ? (
        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-dark"><span className="font-semibold">Bank:</span> {bankDetails.bank_name || 'Not set'}</p>
          <p className="mt-2 text-sm text-dark"><span className="font-semibold">Account name:</span> {bankDetails.account_name || 'Not set'}</p>
          {bankDetails.account_number_masked ? <p className="mt-2 text-sm text-dark"><span className="font-semibold">Account number:</span> {bankDetails.account_number_masked}</p> : null}
          <p className={`mt-3 text-xs font-semibold ${bankDetails.verified ? 'text-emerald-700' : 'text-amber-700'}`}>
            {bankDetails.verified ? 'Verified with Paystack' : 'Legacy bank details. Re-validate before saving changes.'}
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <h4 className="text-lg font-bold text-dark">{title}</h4>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Bank</label>
          <OptionSelect
            value={formData.bank_code}
            options={bankOptions}
            onChange={(value) => handleChange({ target: { name: 'bank_code', value } })}
            disabled={banksLoading}
            error={Boolean(errors.bank_code)}
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
          {errors.bank_code ? <p className="mt-1 text-xs font-medium text-red-600">{errors.bank_code}</p> : null}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Account number</label>
          <input
            type="text"
            name="account_number"
            inputMode="numeric"
            value={formData.account_number}
            onChange={handleChange}
            placeholder="0123456789"
            className={`mt-1 w-full rounded-xl border bg-gray-50 px-4 py-3 font-mono text-sm text-dark placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 ${errors.account_number ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'}`}
          />
          {errors.account_number ? <p className="mt-1 text-xs font-medium text-red-600">{errors.account_number}</p> : null}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Account name</label>
          <input
            type="text"
            value={formData.account_name}
            readOnly
            placeholder={resolveState.loading ? 'Resolving account...' : 'Account name will appear after validation'}
            className="mt-1 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600"
          />
          {errors.account_name ? <p className="mt-1 text-xs font-medium text-red-600">{errors.account_name}</p> : null}
        </div>

        {resolveState.loading ? (
          <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            <Loader2 size={16} className="mt-0.5 animate-spin shrink-0" />
            <p>Validating bank account with Paystack...</p>
          </div>
        ) : null}

        {resolveState.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="flex gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{resolveState.error}</p>
            </div>
            {formData.bank_code && formData.account_number.length === ACCOUNT_NUMBER_LENGTH ? (
              <button
                type="button"
                onClick={() => resolveAccount(formData.bank_code, formData.account_number).catch(() => {})}
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
          {loading ? 'Saving...' : saveLabel}
        </button>
      </form>
    </div>
  );
};

export default PaystackBankAccountForm;
