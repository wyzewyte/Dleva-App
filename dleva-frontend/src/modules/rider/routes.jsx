/**
 * Rider Routes Configuration
 * Handles all rider module routing including all pages and sub-routes
 */

import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Deliveries from '../pages/Deliveries';
import DeliveryDetail from '../pages/DeliveryDetail';
import Wallet from '../pages/Wallet';
import Withdrawal from '../pages/Withdrawal';
import Profile from '../pages/Profile';
import Performance from '../pages/Performance';
import Feedback from '../pages/Feedback';
import Settings from '../pages/Settings';
import Promotion from '../pages/Promotion';
import Help from '../pages/Help';
import FAQ from '../pages/FAQ';
import Contact from '../pages/Contact';

export const riderRoutes = [
  {
    path: '/rider',
    element: <Home />,
  },
  {
    path: '/rider/home',
    element: <Home />,
  },
  {
    path: '/rider/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/rider/orders',
    element: <Deliveries />,
  },
  {
    path: '/rider/delivery/:id',
    element: <DeliveryDetail />,
  },
  {
    path: '/rider/wallet',
    element: <Wallet />,
  },
  {
    path: '/rider/withdrawal',
    element: <Withdrawal />,
  },
  {
    path: '/rider/profile',
    element: <Profile />,
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
