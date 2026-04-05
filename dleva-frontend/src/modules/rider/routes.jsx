/**
 * Rider Routes Configuration
 * Handles all rider module routing including all pages and sub-routes
 */

import Dashboard from '../pages/Dashboard';
import Deliveries from '../pages/Deliveries';
import OrderDetails from '../pages/OrderDetails';
import Earnings from '../pages/Earnings';
import OrderHistory from '../pages/OrderHistory';
import Settings from '../pages/Settings';
import Performance from '../pages/Performance';
import Feedback from '../pages/Feedback';
import Promotion from '../pages/Promotion';
import Help from '../pages/Help';
import FAQ from '../pages/FAQ';
import Contact from '../pages/Contact';
import PhoneVerification from '../pages/PhoneVerification';
import DocumentVerification from '../pages/DocumentVerification';
import BankDetailsVerification from '../pages/BankDetailsVerification';
import ServiceAreaVerification from '../pages/ServiceAreaVerification';
import VerificationSetup from '../pages/VerificationSetup';

export const riderRoutes = [
  {
    path: '/rider',
    element: <Dashboard />,
  },
  {
    path: '/rider/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/rider/home',
    element: <Dashboard />,
  },
  {
    path: '/rider/verification-setup',
    element: <VerificationSetup />,
  },
  {
    path: '/rider/verification-phone',
    element: <PhoneVerification />,
  },
  {
    path: '/rider/verification-documents',
    element: <DocumentVerification />,
  },
  {
    path: '/rider/verification-bank',
    element: <BankDetailsVerification />,
  },
  {
    path: '/rider/verification-location',
    element: <ServiceAreaVerification />,
  },
  {
    path: '/rider/deliveries',
    element: <Deliveries />,
  },
  {
    path: '/rider/orders/:orderId',
    element: <OrderDetails />,
  },
  {
    path: '/rider/order-history',
    element: <OrderHistory />,
  },
  {
    path: '/rider/wallet',
    element: <Earnings />,
  },
  {
    path: '/rider/earnings',
    element: <Earnings />,
  },
  {
    path: '/rider/withdrawal',
    element: <Earnings />,
  },
  {
    path: '/rider/profile',
    element: <Settings />,
  },
  {
    path: '/rider/performance',
    element: <Performance />,
  },
  {
    path: '/rider/feedback',
    element: <Feedback />,
  },
  {
    path: '/rider/settings',
    element: <Settings />,
  },
  {
    path: '/rider/promotions',
    element: <Promotion />,
  },
  {
    path: '/rider/help',
    element: <Help />,
  },
  {
    path: '/rider/faq',
    element: <FAQ />,
  },
  {
    path: '/rider/contact',
    element: <Contact />,
  },
];

export default riderRoutes;
