import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useRiderAuth } from '../context/RiderAuthContext';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { useRealtimeInitializer } from '../hooks';
import { RiderDeliveryProvider } from '../context/RiderDeliveryContext';
import RiderHeader from '../components/RiderHeader';
import OfflineStatus from '../components/OfflineStatus';

const RiderLayout = () => {
  const navigate = useNavigate();
  const { token, loading: authLoading } = useRiderAuth();
  const { status: verificationStatus, loading: statusLoading } = useVerificationStatus();

  console.debug('[RiderLayout] token:', token, 'authLoading:', authLoading, 'verificationStatus:', verificationStatus, 'statusLoading:', statusLoading);

  // ✅ CALL ALL HOOKS FIRST - UNCONDITIONALLY (before any early returns)
  useRealtimeInitializer();

  // ✅ Redirect logic: If verification is complete, go to dashboard
  // If verification is incomplete and trying to access dashboard, go to verification page
  useEffect(() => {
    if (statusLoading || authLoading) return; // Wait for status to load
    
    // ⚠️ Guard: If status is null, don't redirect (still loading)
    if (!verificationStatus) return;

    const currentPath = window.location.pathname;
    const isOnDashboard = currentPath === '/rider/dashboard' || currentPath === '/rider/home';
    const isOnVerification = currentPath === '/rider/verification-setup';

    // ✅ If verified but on verification page, go to dashboard
    if (verificationStatus.can_go_online && isOnVerification) {
      navigate('/rider/dashboard', { replace: true });
    }

    // ✅ If not verified and on dashboard, go to verification page
    if (!verificationStatus.can_go_online && isOnDashboard) {
      navigate('/rider/verification-setup', { replace: true });
    }
  }, [verificationStatus, statusLoading, authLoading, navigate]);

  // ✅ NOW render conditionally (early returns happen AFTER hooks)

  // Protection: If loading, show spinner
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Protection: If no token, redirect to login
  if (!token) {
    return <Navigate to="/rider/login" replace />;
  }

  return (
    <RiderDeliveryProvider>
      <div className="min-h-screen bg-gray-50">
        <RiderHeader />
        <main className="pt-20">
          <Outlet />
        </main>
        
        {/* Offline Status Indicator */}
        <OfflineStatus position="bottom-right" />
      </div>
    </RiderDeliveryProvider>
  );
};

export default RiderLayout;
