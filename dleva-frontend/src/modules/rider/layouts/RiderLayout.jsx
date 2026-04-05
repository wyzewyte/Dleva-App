import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { useRealtimeInitializer } from '../hooks';
import { RiderDeliveryProvider } from '../context/RiderDeliveryContext';
import RiderAppChrome from '../components/RiderAppChrome';
import OfflineStatus from '../components/OfflineStatus';
import { RiderPageShell } from '../components/ui/RiderPrimitives';

const RiderLayout = () => {
  const navigate = useNavigate();
  const { token, loading: authLoading, updateProfile } = useRiderAuth();
  const { status: verificationStatus, loading: statusLoading } = useVerificationStatus();
  const updateProfileRef = useRef(updateProfile);

  // ✅ CALL ALL HOOKS FIRST - UNCONDITIONALLY (before any early returns)
  useRealtimeInitializer();

  useEffect(() => {
    updateProfileRef.current = updateProfile;
  }, [updateProfile]);

  // ✅ Redirect logic: If verification is complete, go to dashboard
  // If verification is incomplete and trying to access dashboard, go to verification page
  useEffect(() => {
    if (statusLoading || authLoading) return; // Wait for status to load
    
    // ⚠️ Guard: If status is null, don't redirect (still loading)
    if (!verificationStatus) return;

    const currentPath = window.location.pathname;
    const isWorkRoute =
      currentPath === '/rider/dashboard' ||
      currentPath === '/rider/home' ||
      currentPath === '/rider/available-orders' ||
      currentPath === '/rider/active-orders' ||
      currentPath === '/rider/deliveries' ||
      currentPath === '/rider/earnings' ||
      currentPath === '/rider/order-history' ||
      currentPath.startsWith('/rider/orders/');
    const isOnVerification = currentPath === '/rider/verification-setup';

    // ✅ If verified but on verification page, go to dashboard
    if (verificationStatus.can_go_online && isOnVerification) {
      navigate('/rider/dashboard', { replace: true });
    }

    // ✅ If not verified and on dashboard, go to verification page
    if (!verificationStatus.can_go_online && isWorkRoute) {
      navigate('/rider/verification-setup', { replace: true });
    }
  }, [verificationStatus, statusLoading, authLoading, navigate]);

  useEffect(() => {
    if (!verificationStatus) return;
    updateProfileRef.current({
      can_go_online: verificationStatus.can_go_online,
      phone_verified: verificationStatus.phone_verified,
      verification_status: verificationStatus.verification_status,
      account_status: verificationStatus.account_status,
      is_online: verificationStatus.is_online,
    });
  }, [verificationStatus]);

  // ✅ NOW render conditionally (early returns happen AFTER hooks)

  // Protection: If loading, show spinner
  if (authLoading || statusLoading) {
    return (
      <RiderPageShell withBottomNavSpacing={false} contentClassName="flex min-h-screen items-center justify-center px-0">
        <div className="flex min-h-screen w-full items-center justify-center bg-white">
          <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-dark">Loading rider workspace</h2>
              <p className="text-sm text-muted">Please wait a moment.</p>
            </div>
          </div>
        </div>
      </RiderPageShell>
    );
  }

  // Protection: If no token, redirect to login
  if (!token) {
    return <Navigate to="/rider/login" replace />;
  }

  return (
    <RiderDeliveryProvider>
      <div className="min-h-screen bg-white">
        <RiderAppChrome />
        <main className="pt-[72px]">
          <Outlet />
        </main>
        
        {/* Offline Status Indicator */}
        <OfflineStatus position="bottom-right" />
      </div>
    </RiderDeliveryProvider>
  );
};

export default RiderLayout;
