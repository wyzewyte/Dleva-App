/**
 * useSellerNotifications Hook
 * Custom hook for managing seller notifications
 */

import { useContext } from 'react';
import { SellerNotificationsContext } from '../context/SellerNotificationsContext';

export function useSellerNotifications() {
  const context = useContext(SellerNotificationsContext);

  if (!context) {
    throw new Error(
      'useSellerNotifications must be used within SellerNotificationsProvider'
    );
  }

  return context;
}

export default useSellerNotifications;
