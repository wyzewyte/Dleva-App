/**
 * Bank Details Verification Page
 * Allows riders to add/update their bank account information for payouts
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, Loader2, DollarSign, Eye, EyeOff } from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderVerification from '../services/riderVerification';

const BankDetailsVerification = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();

  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
  });

  const [existingBankDetails, setExistingBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing bank details on mount
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        setLoading(true);
        const data = await riderVerification.getBankDetails();
        if (data) {
          setExistingBankDetails(data);
          // Pre-fill form with existing data (will be masked for account number)
          setFormData({
            bank_name: data.bank_name || '',
            account_name: data.account_name || '',
            account_number: '', // Don't show masked number, let user re-enter full number
          });
        }
      } catch (err) {
        console.error('Failed to fetch bank details:', err);
        // It's okay if bank details don't exist yet
      } finally {
        setLoading(false);
      }
    };

    if (rider) {
      fetchBankDetails();
    }
  }, [rider]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.bank_name.trim()) {
      setError('Bank name is required');
      return false;
    }
    if (!formData.account_name.trim()) {
      setError('Account holder name is required');
      return false;
    }
    if (!formData.account_number.trim()) {
      setError('Account number is required');
      return false;
    }
    if (!formData.account_number.match(/^\d+$/)) {
      setError('Account number must contain only digits');
      return false;
    }
    if (formData.account_number.length < 10) {
      setError('Account number must be at least 10 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await riderVerification.addBankDetails(formData);
      
      setSuccess('✓ Bank details saved successfully!');
      setExistingBankDetails(response);
      setIsEditing(false);
      
      // Clear form and show existing details
      setFormData({
        bank_name: response.bank_name || '',
        account_name: response.account_name || '',
        account_number: '',
      });

      // Auto-navigate back after 2 seconds
      setTimeout(() => {
        navigate('/rider/verification-setup');
      }, 2000);
    } catch (err) {
      console.error('Failed to save bank details:', err);
      setError(err.error || 'Failed to save bank details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setFormData({
      bank_name: existingBankDetails?.bank_name || '',
      account_name: existingBankDetails?.account_name || '',
      account_number: '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      bank_name: existingBankDetails?.bank_name || '',
      account_name: existingBankDetails?.account_name || '',
      account_number: '',
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="text-gray-600 font-medium">Loading bank details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/rider/verification-setup')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bank Details</h1>
            <p className="text-gray-600 mt-1">Add your bank account for payouts</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <DollarSign size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Your bank details are securely stored and only used for payout transfers. We never save sensitive information.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-700">{success}</p>
              <p className="text-xs text-green-600 mt-1">Redirecting you back...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Existing Bank Details (Read View) */}
        {existingBankDetails && !isEditing && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Bank Details</h2>
                <p className="text-sm text-gray-600 mt-1">Your registered bank account</p>
              </div>
              {!isEditing && (
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <p className="text-base text-gray-900">{existingBankDetails.bank_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                <p className="text-base text-gray-900">{existingBankDetails.account_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <p className="text-base text-gray-900 font-mono">{existingBankDetails.account_number_masked}</p>
              </div>

              {existingBankDetails.verified && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check size={18} className="text-green-600" />
                  <p className="text-sm font-medium text-green-700">Bank details verified</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form (Edit/New) */}
        {(!existingBankDetails || isEditing) && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {existingBankDetails && isEditing ? 'Update Bank Details' : 'Add Bank Details'}
            </h2>

            <div className="space-y-6">
              {/* Bank Name */}
              <div>
                <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  id="bank_name"
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Standard Bank, Zenith Bank"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  required
                />
              </div>

              {/* Account Holder Name */}
              <div>
                <label htmlFor="account_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  id="account_name"
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  placeholder="Full name as shown on bank account"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  required
                />
              </div>

              {/* Account Number */}
              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <div className="relative">
                  <input
                    id="account_number"
                    type={showAccountNumber ? 'text' : 'password'}
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    placeholder="10+ digits"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    title={showAccountNumber ? 'Hide' : 'Show'}
                  >
                    {showAccountNumber ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 10 digits</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              {isEditing && existingBankDetails && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  submitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <DollarSign size={18} />
                    {existingBankDetails && !isEditing ? 'Update' : 'Save'} Bank Details
                  </>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                🔒 <strong>Security:</strong> Your bank account information is encrypted and never shared with third parties. We only use it to process your payouts.
              </p>
            </div>
          </form>
        )}

        {/* Empty State */}
        {!existingBankDetails && !isEditing && loading === false && (
          <div className="text-center">
            <p className="text-gray-600">No bank details added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDetailsVerification;
