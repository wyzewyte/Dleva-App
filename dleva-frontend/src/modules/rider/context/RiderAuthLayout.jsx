/**
 * RiderAuthLayout - Wraps children with RiderAuthProvider and OrderProvider
 * This is the "playpen" that makes auth and order data available to all children
 */

import { Outlet } from 'react-router-dom';
import { RiderAuthProvider } from './RiderAuthContext';
import { OrderProvider } from './OrderContext';

export default function RiderAuthLayout() {
  return (
    <RiderAuthProvider>
      <OrderProvider>
        <Outlet />
      </OrderProvider>
    </RiderAuthProvider>
  );
}
