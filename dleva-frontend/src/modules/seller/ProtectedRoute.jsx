import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const sellerAccessToken = localStorage.getItem('seller_access_token');

  // If no token, redirect to login
  if (!sellerAccessToken) {
    return <Navigate to="/seller/login" replace />;
  }

  // If token exists, render the component
  return children;
};

export default ProtectedRoute;