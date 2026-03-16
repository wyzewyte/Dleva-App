/**
 * Rider Verification Setup Page
 * Consolidates all verification requirements (documents, bank, location)
 * Guides rider through the verification process
 */

import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { FileText, Banknote, MapPin, CheckCircle } from 'lucide-react';

const VERIFICATION_STEPS = [
  {
    id: 'phone',
    name: 'Phone Verification',
    description: 'Verify your phone number via OTP',
    path: '/rider/verification-phone',
    icon: FileText,
  },
  {
    id: 'documents',
    name: 'Document Verification',
    description: 'Upload your government-issued ID, license, and vehicle registration',
    path: '/rider/verification-documents',
    icon: FileText,
  },
  {
    id: 'bank',
    name: 'Bank Details',
    description: 'Add your bank account for payouts',
    path: '/rider/verification-bank',
    icon: Banknote,
  },
  {
    id: 'location',
    name: 'Service Area',
    description: 'Confirm your service area location',
    path: '/rider/verification-location',
    icon: MapPin,
  },
];

const VerificationSetup = () => {
  const navigate = useNavigate();
  const { status, loading } = useVerificationStatus();

  // ✅ If user can go online, redirect to dashboard
  if (status?.can_go_online) {
    navigate('/rider/dashboard', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Unable to load verification status. Please try again.</p>
      </div>
    );
  }

  const getCompletionStatus = () => {
    // ✅ Only track fields that backend returns (phone, documents, bank)
    // Location is an optional setup step, not required for verification
    const verificationStatus = {
      documents: status.documents_approved || false,
      bank: status.bank_details_added || false,
      phone: status.phone_verified || false,
      // location status not tracked by backend - it's an optional preference
    };
    const completed = Object.values(verificationStatus).filter(Boolean).length;
    return { verificationStatus, completed, total: 3 };
  };

  const { verificationStatus, completed, total } = getCompletionStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-dark mb-4">Account Verification</h1>
          <p className="text-gray-600 text-lg">
            Complete all steps to go online and start accepting deliveries
          </p>

          {/* Progress */}
          <div className="mt-8 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl font-bold text-primary">{completed}</span>
              <span className="text-gray-600">/</span>
              <span className="text-2xl font-bold text-gray-600">{total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>

          {completed === total && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">
                ✓ All verifications complete! You can now go online.
              </p>
            </div>
          )}
        </div>

        {/* Verification Steps */}
        <div className="space-y-4">
          {VERIFICATION_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = verificationStatus[step.id];

            return (
              <button
                key={step.id}
                onClick={() => navigate(step.path)}
                className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                  isCompleted
                    ? 'border-green-300 bg-green-50 hover:bg-green-100'
                    : 'border-gray-300 bg-white hover:border-primary hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        isCompleted ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        size={24}
                        className={isCompleted ? 'text-green-600' : 'text-gray-600'}
                      />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isCompleted ? 'text-green-700' : 'text-dark'
                      }`}>
                        {step.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {isCompleted && (
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Why do we need these verifications?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Documents verify your identity and driving eligibility</li>
            <li>Bank details are needed for secure payouts</li>
            <li>Service area confirms you can deliver in your region</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerificationSetup;
