import { Navigate } from 'react-router-dom';
import { useRiderAuth } from './context/RiderAuthContext';

const RiderProtectedRoute = ({ children }) => {
  const { token, loading } = useRiderAuth();

  // While loading, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/rider/login" replace />;
  }

  // If token exists, render the component
  return children;
};

export default RiderProtectedRoute;
