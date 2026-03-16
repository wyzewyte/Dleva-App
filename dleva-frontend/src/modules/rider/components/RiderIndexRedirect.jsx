import { Navigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';

/**
 * Smart redirect component for the /rider index route
 * 
 * Logic:
 * - If user is logged in (has token) → redirect to dashboard
 * - If user is NOT logged in → redirect to login
 * - If loading → return null (prevent flickering)
 * 
 * This prevents the "dumb redirect" bounce where logged-in users
 * would be sent to /rider/login regardless of authentication state
 */
const RiderIndexRedirect = () => {
  const { token, loading } = useRiderAuth();

  // While loading auth state, render nothing
  // This prevents a flash of the login page
  if (loading) {
    return null;
  }

  // Smart redirect based on authentication state
  if (token) {
    // User is authenticated → go to dashboard
    return <Navigate to="/rider/dashboard" replace />;
  }

  // User is not authenticated → go to login
  return <Navigate to="/rider/login" replace />;
};

export default RiderIndexRedirect;
