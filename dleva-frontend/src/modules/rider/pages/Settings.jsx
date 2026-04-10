import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Camera, ChevronRight, LifeBuoy, Loader2, LogOut, MapPin, Pencil, ShieldAlert, Star, Truck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderSettings from '../services/riderSettings';
import riderVerification from '../services/riderVerification';
import RiderLocationManagement from './components/RiderLocationManagement';
import BankDetailsForm from './components/BankDetailsForm';
import ProfileForm from './components/ProfileForm';
import VehicleInfo from './components/VehicleInfo';
import FeedbackDisplay from '../components/FeedbackDisplay';
import {
  RiderCard,
  RiderFormField,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSecondaryButton,
  RiderStatusBadge,
  RiderTextInput,
} from '../components/ui/RiderPrimitives';

const initials = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R';

const SettingsModal = ({ open, title, subtitle, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full w-full flex-col">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-dark sm:text-2xl">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-dark transition-colors hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-8 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </div>
      </div>
    </div>
  );
};

const SettingsRow = ({ icon, title, subtitle, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 border-b border-gray-100 px-1 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50/70"
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-50 text-primary">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-base font-semibold text-dark">{title}</p>
      {subtitle ? <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted">{subtitle}</p> : null}
    </div>
    {badge ? (
      <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        {badge}
      </div>
    ) : null}
    <ChevronRight size={18} className="shrink-0 text-muted" />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { rider, logout, updateProfile: syncRider, refreshRider } = useRiderAuth();
  const fileInputRef = useRef(null);
  const syncRiderRef = useRef(syncRider);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [busyKey, setBusyKey] = useState('');

  const isBusy = (key) => busyKey === key;
  const verificationBadge = useMemo(
    () => [!verification?.phone_verified, !verification?.documents_approved, !(verification?.bank_details_verified ?? verification?.bank_details_added)].filter(Boolean).length,
    [verification]
  );
  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    syncRiderRef.current = syncRider;
  }, [syncRider]);

  const loadSettings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [profileRes, verificationRes, bankRes, performanceRes] = await Promise.allSettled([
        riderSettings.getProfile(),
        riderSettings.getVerificationStatus(),
        riderVerification.getBankDetails(),
        riderSettings.getPerformanceMetrics(rider?.id),
      ]);

      if (profileRes.status !== 'fulfilled') throw profileRes.reason;
      if (verificationRes.status !== 'fulfilled') throw verificationRes.reason;

      const nextProfile = profileRes.value;
      const nextVerification = verificationRes.value;

      setProfile(nextProfile);
      setVerification(nextVerification);
      setBankDetails(bankRes.status === 'fulfilled' ? bankRes.value : null);
      setPerformance(performanceRes.status === 'fulfilled' ? performanceRes.value : null);
      syncRiderRef.current({
        ...nextProfile,
        can_go_online: nextVerification?.can_go_online,
        phone_verified: nextVerification?.phone_verified,
        verification_status: nextVerification?.verification_status,
        account_status: nextVerification?.account_status,
        is_online: nextVerification?.is_online,
      });
    } catch (loadError) {
      setError(loadError?.error || loadError?.message || 'Unable to load rider settings right now.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [rider?.id]);

  useEffect(() => {
    loadSettings().catch(() => {});
  }, [loadSettings]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const saveProfileDetails = async (data) => {
    if (!data?.full_name?.trim()) return setNotice({ type: 'error', message: 'Full name is required.' });
    if (!data?.username?.trim()) return setNotice({ type: 'error', message: 'Username is required.' });
    setBusyKey('profile-details');
    try {
      await riderSettings.updateProfile({
        full_name: data.full_name.trim(),
        username: data.username.trim(),
      });
      await refreshRider?.();
      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Profile updated.' });
      return true;
    } catch (saveError) {
      setNotice({ type: 'error', message: saveError?.error || 'Unable to update profile right now.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const savePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusyKey('photo');
    try {
      const formData = new FormData();
      formData.append('profile_photo', file);
      await riderSettings.updateProfile(formData);
      await refreshRider?.();
      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Profile photo updated.' });
    } catch (saveError) {
      setNotice({ type: 'error', message: saveError?.error || 'Unable to update profile photo right now.' });
    } finally {
      event.target.value = '';
      setBusyKey('');
    }
  };

  const saveVehicle = async (data) => {
    if (!data?.vehicle_plate_number?.trim()) return setNotice({ type: 'error', message: 'Vehicle plate number is required.' });
    setBusyKey('vehicle');
    try {
      await riderSettings.updateProfile({
        vehicle_type: data.vehicle_type,
        vehicle_plate_number: data.vehicle_plate_number.trim().toUpperCase(),
      });
      await refreshRider?.();
      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Vehicle details updated.' });
      return true;
    } catch (saveError) {
      setNotice({ type: 'error', message: saveError?.error || 'Unable to update vehicle details right now.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const saveBank = async (data) => {
    if (!data?.bank_name?.trim()) return setNotice({ type: 'error', message: 'Bank name is required.' });
    if (!data?.account_name?.trim()) return setNotice({ type: 'error', message: 'Account holder name is required.' });
    if (!/^\d{10,}$/.test(data?.account_number?.trim())) return setNotice({ type: 'error', message: 'Enter a valid account number.' });
    setBusyKey('bank');
    try {
      await riderVerification.addBankDetails({
        bank_code: data.bank_code,
        bank_name: data.bank_name.trim(),
        account_name: data.account_name.trim(),
        account_number: data.account_number.trim(),
      });
      await refreshRider?.();
      await loadSettings({ silent: true });
      setNotice({ type: 'success', message: 'Bank details saved.' });
      return true;
    } catch (bankError) {
      setNotice({ type: 'error', message: bankError?.error || 'Unable to save bank details right now.' });
      return false;
    } finally {
      setBusyKey('');
    }
  };

  const handleLogout = async () => {
    setBusyKey('logout');
    try {
      await logout();
      navigate('/rider/login', { replace: true });
    } finally {
      setBusyKey('');
    }
  };

  if (loading) {
    return (
      <RiderPageShell maxWidth="max-w-6xl">
        <RiderPageHeader
          title="Settings"
          subtitle="Everything riders need to keep their account ready, verified, and easy to manage should feel focused here."
          sticky
        />

        <div className="space-y-6 py-6">
          <RiderCard className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="h-24 w-24 animate-pulse rounded-[24px] bg-gray-100" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-100" />
                <div className="flex gap-2">
                  <div className="h-7 w-28 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-7 w-16 animate-pulse rounded-full bg-gray-100" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </RiderCard>

          {[1, 2, 3].map((section) => (
            <section key={section}>
              <div className="mb-3 px-1">
                <div className="h-7 w-36 animate-pulse rounded-lg bg-gray-100" />
              </div>
              <RiderCard className="p-4 sm:p-5">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex items-center gap-3 border-b border-gray-100 px-1 py-3 last:border-b-0">
                    <div className="h-9 w-9 animate-pulse rounded-2xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                      {section === 1 && row === 2 ? <div className="h-4 w-40 animate-pulse rounded bg-gray-100" /> : null}
                    </div>
                    <div className="h-5 w-5 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </RiderCard>
            </section>
          ))}
        </div>
      </RiderPageShell>
    );
  }

  if (error || !profile || !verification) {
    return (
      <RiderPageShell maxWidth="max-w-6xl">
        <div className="py-10">
          <RiderFeedbackState
            type="error"
            title="Unable to load settings"
            message={error || 'Rider settings are unavailable right now.'}
            action={<RiderPrimaryButton onClick={() => loadSettings()} className="sm:w-auto sm:px-5">Try again</RiderPrimaryButton>}
          />
        </div>
      </RiderPageShell>
    );
  }

  return (
    <RiderPageShell maxWidth="max-w-6xl">
      <RiderPageHeader
        title="Settings"
        subtitle="Everything riders need to keep their account ready, verified, and easy to manage should feel focused here."
        sticky
      />

      <div className="space-y-6 py-6">
        {notice ? <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{notice.message}</div> : null}

        <RiderCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] bg-dark text-2xl font-bold text-white">
                  {profile.profile_photo ? <img src={profile.profile_photo} alt={profile.full_name || 'Rider profile'} className="h-full w-full object-cover" /> : initials(profile.full_name || rider?.full_name)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('profile');
                  }}
                  className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white bg-primary text-white shadow-lg"
                >
                  <Pencil size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={savePhoto} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-dark">{profile.full_name || rider?.full_name || 'Rider profile'}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RiderStatusBadge status={verification.can_go_online ? 'approved' : verification.account_status || 'pending'}>
                    {verification.can_go_online ? 'Ready to work' : 'Setup in progress'}
                  </RiderStatusBadge>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-dark">
                    {Number(verification.profile_completion_percent || 0)}%
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-muted">@{profile.username || profile.user?.username || 'rider'}</p>
              </div>
            </div>
        </RiderCard>

        <div className="space-y-6">
          <section>
            <div className="mb-3 px-1">
              <h3 className="text-xl font-bold text-dark">Personal</h3>
            </div>
            <RiderCard className="p-4 sm:p-5">
              <SettingsRow
                icon={<Pencil size={18} />}
                title="Profile details"
                onClick={() => {
                  setActiveModal('profile');
                }}
              />
              <SettingsRow
                icon={<MapPin size={18} />}
                title="Location"
                subtitle={profile.address || 'No work location saved yet'}
                onClick={() => setActiveModal('location')}
              />
              <SettingsRow
                icon={<BadgeCheck size={18} />}
                title="Bank details"
                onClick={() => setActiveModal('bank')}
              />
              <SettingsRow
                icon={<Truck size={18} />}
                title="Vehicle details"
                onClick={() => setActiveModal('vehicle')}
              />
            </RiderCard>
          </section>

          <section>
            <div className="mb-3 px-1">
              <h3 className="text-xl font-bold text-dark">Performance</h3>
            </div>
            <RiderCard className="p-4 sm:p-5">
              <SettingsRow
                icon={<Star size={18} />}
                title="Customer feedback"
                subtitle={performance?.average_rating ? `${parseFloat(performance.average_rating).toFixed(1)} rating · ${performance.total_ratings} reviews` : 'No ratings yet'}
                onClick={() => setActiveModal('feedback')}
              />
            </RiderCard>
          </section>

          <section>
            <div className="mb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-dark">Verification status</h3>
                {verificationBadge > 0 ? <div className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{verificationBadge} pending</div> : null}
              </div>
            </div>
            {verification.blocked_reasons?.length ? (
              <RiderCard className="mb-4 border-amber-100 bg-amber-50 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={18} className="mt-0.5 text-amber-700" />
                  <div>
                    <h4 className="text-base font-bold text-amber-800">What is still blocking rider work</h4>
                    <div className="mt-3 space-y-2">
                      {verification.blocked_reasons.map((reason) => <p key={reason} className="text-sm text-amber-700">{reason}</p>)}
                    </div>
                  </div>
                </div>
              </RiderCard>
            ) : null}
            <RiderCard className="p-4 sm:p-5">
              {[
                ['Phone number', verification.phone_verified],
                ['Documents', verification.documents_approved],
                ['Bank details', verification.bank_details_verified ?? verification.bank_details_added],
              ].map(([label, complete]) => (
                <div key={label} className="flex items-center justify-between border-b border-gray-100 px-1 py-4 last:border-b-0">
                  <span className="text-base font-semibold text-dark">{label}</span>
                  <RiderStatusBadge status={complete ? 'approved' : 'pending'}>{complete ? 'Complete' : 'Pending'}</RiderStatusBadge>
                </div>
              ))}
              <button
                type="button"
                onClick={() => navigate('/rider/verification-setup')}
                className="mt-2 flex w-full items-center justify-between rounded-2xl px-1 py-4 text-left transition-colors hover:bg-gray-50/70"
              >
                <span className="text-base font-semibold text-dark">Open full verification setup</span>
                <ChevronRight size={18} className="text-muted" />
              </button>
            </RiderCard>
          </section>

          <section>
            <div className="mb-3 px-1">
              <h3 className="text-xl font-bold text-dark">Quick actions</h3>
            </div>
            <RiderCard className="p-4 sm:p-5">
              <SettingsRow icon={<ChevronRight size={18} />} title="Order history" onClick={() => navigate('/rider/order-history')} />
              <SettingsRow icon={<LifeBuoy size={18} />} title="Help and support" onClick={() => navigate('/rider/help')} />
              <SettingsRow icon={<LogOut size={18} />} title="Logout" onClick={handleLogout} />
            </RiderCard>
          </section>
        </div>

      </div>

      <SettingsModal
        open={activeModal === 'profile'}
        title="Profile details"
        subtitle="Keep your rider identity up to date here. Email stays locked."
        onClose={closeModal}
      >
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Profile photo</p>
            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] bg-dark text-2xl font-bold text-white">
                {profile.profile_photo ? <img src={profile.profile_photo} alt={profile.full_name || 'Rider profile'} className="h-full w-full object-cover" /> : initials(profile.full_name || rider?.full_name)}
              </div>
              <RiderSecondaryButton type="button" onClick={() => fileInputRef.current?.click()} className="sm:w-auto sm:px-5" icon={isBusy('photo') ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}>
                Change photo
              </RiderSecondaryButton>
            </div>
          </div>

          <ProfileForm
            key={`${profile?.full_name || ''}-${profile?.username || profile?.user?.username || ''}-${profile?.phone_number || ''}-${verification?.phone_verified ? 'verified' : 'pending'}`}
            profile={{ ...profile, phone_verified: verification?.phone_verified }}
            loading={isBusy('profile-details')}
            onSave={saveProfileDetails}
            onPhoneVerified={async () => {
              await refreshRider?.();
              await loadSettings({ silent: true });
              setNotice({ type: 'success', message: 'Phone number verified and saved.' });
            }}
          />
        </div>
      </SettingsModal>

      <SettingsModal open={activeModal === 'location'} title="Location" subtitle="Search, select, and confirm the rider location from one focused flow." onClose={closeModal}>
        <RiderLocationManagement
          profile={profile}
          onLocationUpdate={async () => {
            await refreshRider?.();
            await loadSettings({ silent: true });
            setNotice({ type: 'success', message: 'Work location updated.' });
          }}
          onClose={closeModal}
        />
      </SettingsModal>

      <SettingsModal open={activeModal === 'bank'} title="Bank details" subtitle="Use only the payout fields that already exist in the app." onClose={closeModal}>
        <BankDetailsForm key={`${bankDetails?.bank_name || ''}-${bankDetails?.account_name || ''}-${bankDetails?.account_number_masked || ''}-${bankDetails?.verified ? 'verified' : 'pending'}`} bankDetails={bankDetails} loading={isBusy('bank')} onSave={saveBank} />
      </SettingsModal>

      <SettingsModal open={activeModal === 'vehicle'} title="Vehicle details" subtitle="Keep your active delivery vehicle details simple and accurate." onClose={closeModal}>
        <VehicleInfo key={`${profile?.vehicle_type || ''}-${profile?.vehicle_plate_number || ''}`} profile={profile} loading={isBusy('vehicle')} onSave={saveVehicle} />
      </SettingsModal>

      <SettingsModal open={activeModal === 'feedback'} title="Customer Feedback" subtitle="See what customers say about your deliveries and driving" onClose={closeModal}>
        <FeedbackDisplay performance={performance} loading={false} />
      </SettingsModal>
    </RiderPageShell>
  );
};

export default Settings;
