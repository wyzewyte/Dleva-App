import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Location Provider
import { LocationProvider } from './context/LocationContext';

// Phase 4: Tracking Provider
import { TrackingProvider } from './context/TrackingContext';

// Toast Notification Component
import Toast from './modules/rider/components/Toast';

// Location Setup Wrapper (provides location modal globally)
import LocationSetupWrapper from './components/LocationSetupWrapper';

// Protected Route Guard
import ProtectedRoute from './components/ProtectedRoute';
import SellerProtectedRoute from './modules/seller/ProtectedRoute';

// Buyer Pages
import BuyerHome from './modules/buyer/pages/HomeModern';
import Menu from './modules/buyer/pages/MenuModern';
import OrdersHub from './modules/buyer/pages/OrdersHub';
import Search from './modules/buyer/pages/SearchModern';
import Checkout from './modules/buyer/pages/Checkout';
import PaymentCallbackModern from './modules/buyer/pages/PaymentCallbackModern';
import Tracking from './modules/buyer/pages/TrackingModern';
import Login from './modules/buyer/pages/auth/BuyerLoginModern';
import Signup from './modules/buyer/pages/auth/SignupModern';
import ForgotPassword from './modules/buyer/pages/auth/ForgotPasswordModern';
import VerifyCode from './modules/buyer/pages/auth/VerifyCodeModern';
import ResetPassword from './modules/buyer/pages/auth/ResetPasswordModern';
import Profile from './modules/buyer/pages/ProfileModern';
import OrderHistoryModern from './modules/buyer/pages/OrderHistoryModern';
import HelpSupport from './modules/buyer/pages/HelpSupportModern';
import RestaurantList from './modules/buyer/pages/RestaurantListModern';
import LocationSetup from './modules/buyer/pages/auth/LocationSetup';
import ChangePassword from './modules/buyer/pages/ChangePasswordModern';

// Seller Pages
import SellerDashboard from './modules/seller/pages/Dashboard';
import SellerMenu from './modules/seller/pages/Menu';
import SellerOrders from './modules/seller/pages/Orders';
import SellerHistory from './modules/seller/pages/History';  // ✅ ADD THIS
import SellerSettings from './modules/seller/pages/Settings';
import SellerNotificationsPage from './pages/seller/NotificationsPage';
import SellerLogin from './modules/seller/pages/auth/Login';
import SellerRegister from './modules/seller/pages/auth/Register';

// Seller Context/Providers
import { SellerNotificationsProvider } from './context/SellerNotificationsContext';

// Rider Pages
import RiderLogin from './modules/rider/pages/auth/Login';
import RiderRegister from './modules/rider/pages/auth/Register';
import RiderForgotPassword from './modules/rider/pages/auth/ForgotPassword';
import RiderVerifyResetCode from './modules/rider/pages/auth/VerifyResetCode';
import RiderResetPassword from './modules/rider/pages/auth/ResetPassword';
import VerificationSetup from './modules/rider/pages/VerificationSetup';
import PhoneVerification from './modules/rider/pages/PhoneVerification';
import DocumentVerification from './modules/rider/pages/DocumentVerification';
import BankDetailsVerification from './modules/rider/pages/BankDetailsVerification';
import ServiceAreaVerification from './modules/rider/pages/ServiceAreaVerification';
import RiderDashboard from './modules/rider/pages/Dashboard';
import RiderEarnings from './modules/rider/pages/Earnings';
import RiderProfileSettings from './modules/rider/pages/Settings';
import Deliveries from './modules/rider/pages/Deliveries';
import OrderDetails from './modules/rider/pages/OrderDetails';
import RiderOrderHistory from './modules/rider/pages/OrderHistory';
import Performance from './modules/rider/pages/Performance';
import Feedback from './modules/rider/pages/Feedback';
import Promotion from './modules/rider/pages/Promotion';
import Help from './modules/rider/pages/Help';
import FAQ from './modules/rider/pages/FAQ';
import Contact from './modules/rider/pages/Contact';
import RiderNotifications from './modules/rider/pages/Notifications';

// Component
import CartDrawer from './modules/buyer/components/CartDrawer';

// Layouts
import BuyerLayout from './layouts/BuyerLayout';
import SellerLayout from './layouts/SellerLayout';
import RiderLayout from './modules/rider/layouts/RiderLayout';
import RiderAuthLayout from './modules/rider/context/RiderAuthLayout';
import RiderIndexRedirect from './modules/rider/components/RiderIndexRedirect';

function App() {
  return (
    <LocationProvider>
      <TrackingProvider>
        <Router>
          <LocationSetupWrapper>
            {/* Cart Drawer (Visible globally, controlled by state) */}
            <CartDrawer />

            {/* Toast Notifications (Visible globally) */}
            <Toast />

            <Routes>
          
          {/* ============================== */}
          {/* 🟢 PUBLIC STANDALONE ROUTES    */}
          {/* ============================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} /> 
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Location Setup must be public for Guests */}
          <Route path="/setup-location" element={<LocationSetup />} />


          {/* ============================== */}
          {/* 🟢 BUYER MAIN APP (Layout)     */}
          {/* ============================== */}
          {/* Wraps both Public and Protected pages so they share the Navbar */}
          <Route element={<BuyerLayout />}>
              
              {/* --- Public Pages (Guests Allowed) --- */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<BuyerHome />} />
              <Route path="/search" element={<Search />} />
              <Route path="/restaurants" element={<RestaurantList />} />
              <Route path="/restaurant/:id" element={<Menu />} />
              <Route path="/cart" element={<Navigate to="/orders?tab=cart" replace />} />
              <Route path="/orders" element={<OrdersHub />} />
              <Route path="/support" element={<HelpSupport />} /> {/* Often public */}

              {/* --- Protected Pages (Login Required) --- */}
              {/* We nest the Guard HERE to protect only specific pages */}
              <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/history" element={<OrderHistoryModern />} />
                  <Route path="/tracking/:orderId" element={<Tracking />} />  
                  <Route path="/change-password" element={<ChangePassword />} />
              </Route>

          </Route>


          {/* ============================== */}
          {/* 🔒 CHECKOUT (Protected)        */}
          {/* ============================== */}
          {/* Checkout is usually standalone (no sidebar) to reduce distractions */}
          <Route element={<ProtectedRoute />}>
              <Route path="/checkout/:vendorId" element={<Checkout />} />
              <Route path="/payment/callback" element={<PaymentCallbackModern />} /> {/* ✅ PAYSTACK CALLBACK */}
          </Route>


          {/* ============================== */}
          {/* 🟣 SELLER ROUTES               */}
          {/* ============================== */}
          
          {/* Public Seller Auth */}
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/register" element={<SellerRegister />} />

          {/* Protected Seller Pages */}
          <Route 
            path="/seller/*" 
            element={
              <SellerNotificationsProvider>
                <SellerProtectedRoute>
                  <SellerLayout />
                </SellerProtectedRoute>
              </SellerNotificationsProvider>
            }
          >
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="menu" element={<SellerMenu />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="history" element={<SellerHistory />} />  {/* ✅ ADD THIS */}
            <Route path="settings" element={<SellerSettings />} />
            <Route path="notifications" element={<SellerNotificationsPage />} />
          </Route>


          {/* ============================== */}
          {/* 🔴 RIDER ROUTES                */}
          {/* ============================== */}
          {/* RiderAuthLayout is the "playpen" provider -  uses Outlet for children */}
          <Route path="/rider" element={<RiderAuthLayout />}>
            {/* Smart index route: checks auth state before redirecting */}
            <Route index element={<RiderIndexRedirect />} />
            
            {/* Public Rider Auth Routes */}
            <Route path="login" element={<RiderLogin />} />
            <Route path="register" element={<RiderRegister />} />
            <Route path="forgot-password" element={<RiderForgotPassword />} />
            <Route path="verify-reset-code" element={<RiderVerifyResetCode />} />
            <Route path="reset-password" element={<RiderResetPassword />} />
            <Route path="verification-setup" element={<VerificationSetup />} />

            {/* Protected Rider Pages */}
            <Route element={<RiderLayout />}>
              {/* Core Pages */}
              <Route path="dashboard" element={<RiderDashboard />} />
              <Route path="home" element={<Navigate to="/rider/dashboard" replace />} />
              <Route path="verification-phone" element={<PhoneVerification />} />
              <Route path="verification-documents" element={<DocumentVerification />} />
              <Route path="verification-bank" element={<BankDetailsVerification />} />
              <Route path="verification-location" element={<ServiceAreaVerification />} />
              
              {/* Order Pages - Phase 2 */}
              <Route path="available-orders" element={<Navigate to="/rider/deliveries?tab=pending" replace />} />
              <Route path="active-orders" element={<Navigate to="/rider/deliveries?tab=ongoing" replace />} />
              <Route path="deliveries" element={<Deliveries />} />
              <Route path="orders/:orderId" element={<OrderDetails />} />
              <Route path="order-history" element={<RiderOrderHistory />} />
              
              {/* Legacy Delivery Pages */}
              <Route path="delivery/:id" element={<Navigate to="/rider/deliveries?tab=ongoing" replace />} />
              <Route path="active-delivery/:orderId" element={<Navigate to="/rider/deliveries?tab=ongoing" replace />} />
              
              {/* Wallet & Earnings */}
              <Route path="wallet" element={<RiderEarnings />} />
              <Route path="earnings" element={<Navigate to="/rider/wallet" replace />} />
              <Route path="withdrawal" element={<Navigate to="/rider/wallet" replace />} />
              <Route path="notifications" element={<RiderNotifications />} />
              
              {/* Profile & Account */}
              <Route path="profile" element={<Navigate to="/rider/settings" replace />} />
              <Route path="settings" element={<RiderProfileSettings />} />
              
              {/* Performance & Ratings */}
              <Route path="performance" element={<Performance />} />
              
              {/* Promotions */}
              <Route path="promotions" element={<Promotion />} />
              
              {/* Support Pages */}
              <Route path="feedback" element={<Feedback />} />
              <Route path="help" element={<Help />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* Catch-all: Redirect unknown paths to login */}
            <Route path="*" element={<Navigate to="/rider/login" replace />} />
          </Route>

            </Routes>
          </LocationSetupWrapper>
        </Router>
      </TrackingProvider>
    </LocationProvider>
  );
}

export default App;


