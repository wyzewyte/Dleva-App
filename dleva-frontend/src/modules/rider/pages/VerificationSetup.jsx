import { ArrowRight, Banknote, CheckCircle2, FileText, MapPin, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useRiderVerificationStatus from '../hooks/useRiderVerificationStatus';
import {
  RiderCard,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderStatusBadge,
} from '../components/ui/RiderPrimitives';

const STEPS = [
  {
    id: 'phone',
    title: 'Phone verification',
    description: 'Verify your rider phone number so order and payout communication works properly.',
    path: '/rider/verification-phone',
    icon: Smartphone,
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload and review your identity and vehicle documents.',
    path: '/rider/verification-documents',
    icon: FileText,
  },
  {
    id: 'bank',
    title: 'Bank details',
    description: 'Add the payout account that receives rider earnings.',
    path: '/rider/verification-bank',
    icon: Banknote,
  },
  {
    id: 'location',
    title: 'Location setup',
    description: 'Set the location Dleva should use for matching delivery requests.',
    path: '/rider/verification-location',
    icon: MapPin,
  },
];

const VerificationSetup = () => {
  const navigate = useNavigate();
  const { status, loading } = useRiderVerificationStatus();

  if (loading) {
    return (
      <RiderPageShell maxWidth="max-w-4xl">
        <RiderPageHeader
          title="Verification Setup"
          subtitle="Riders should always know what is blocking work, what is done already, and which step to complete next."
          sticky
          className="top-0"
        />

        <div className="space-y-6 py-6">
          <RiderCard className="p-6">
            <div className="space-y-3">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-10 w-20 animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100" />
              </div>
              <div className="h-2 w-full animate-pulse rounded-full bg-gray-100" />
            </div>
          </RiderCard>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((step) => (
              <RiderCard key={step} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
                    <div className="space-y-2">
                      <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-52 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                  <div className="h-11 w-28 animate-pulse rounded-xl bg-gray-100" />
                </div>
              </RiderCard>
            ))}
          </div>
        </div>
      </RiderPageShell>
    );
  }

  const stepState = {
    phone: Boolean(status?.phone_verified),
    documents: Boolean(status?.documents_approved),
    bank: Boolean(status?.bank_details_verified ?? status?.bank_details_added),
    location: Boolean(status?.location_set),
  };

  const completedCoreCount = [stepState.phone, stepState.documents, stepState.bank, stepState.location].filter(Boolean).length;
  const allCoreStepsCompleted =
    Boolean(status?.can_go_online) ||
    Boolean(status?.verification_status === 'approved') ||
    Boolean(status?.account_status === 'approved') ||
    completedCoreCount === STEPS.length;

  const getStepBadge = (step) => {
    const complete = stepState[step.id];
    if (complete) {
      return { status: 'approved', label: 'Complete' };
    }

    if (step.id === 'documents') {
      const documentStatuses = Object.values(status?.documents || {}).map((document) => document?.status);
      if (documentStatuses.includes('rejected')) {
        return { status: 'rejected', label: 'Needs update' };
      }
      if (documentStatuses.includes('pending')) {
        return { status: 'pending', label: 'Pending review' };
      }
    }

    return { status: 'offline', label: step.optional ? 'Optional' : 'Not started' };
  };

  return (
    <RiderPageShell maxWidth="max-w-4xl" withBottomNavSpacing={false}>
      <RiderPageHeader
        title="Verification Setup"
        subtitle="Riders should always know what is blocking work, what is done already, and which step to complete next."
        sticky
        className="top-0"
      />

      <div className="space-y-6 py-6">
        <RiderCard className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Progress</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold text-dark">{completedCoreCount}/{STEPS.length}</p>
              <p className="mt-2 text-sm text-muted">Verification steps completed.</p>
            </div>
            <RiderStatusBadge status={status?.can_go_online ? 'approved' : 'pending'}>
              {status?.can_go_online ? 'Ready to work' : 'Verification in progress'}
            </RiderStatusBadge>
          </div>
          <div className="mt-5 h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(completedCoreCount / STEPS.length) * 100}%` }} />
          </div>
          {allCoreStepsCompleted ? (
            <div className="mt-5 flex justify-start">
              <RiderPrimaryButton
                onClick={() => navigate('/rider/dashboard')}
                className="w-full bg-[#FF6B00] hover:bg-[#e56000] sm:w-auto sm:px-6"
                icon={<ArrowRight size={16} />}
              >
                Go to Dashboard
              </RiderPrimaryButton>
            </div>
          ) : null}
        </RiderCard>

        <div className="space-y-4">
          {STEPS.map((step) => {
            const complete = stepState[step.id];
            const badge = getStepBadge(step);
            return (
              <RiderCard key={step.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <step.icon size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-dark">{step.title}</h2>
                        <RiderStatusBadge status={badge.status}>
                          {badge.label}
                        </RiderStatusBadge>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
                    </div>
                  </div>

                  <RiderPrimaryButton
                    onClick={() => navigate(step.path)}
                    className="w-full sm:w-auto sm:px-5"
                    icon={complete ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                  >
                    {complete ? 'Review step' : 'Open step'}
                  </RiderPrimaryButton>
                </div>
              </RiderCard>
            );
          })}
        </div>
      </div>
    </RiderPageShell>
  );
};

export default VerificationSetup;
