/**
 * useSellerNotifications Hook
 * Custom hook for managing seller notifications
 */

import * as React from 'react';
import { SellerNotificationsContext } from '../context/SellerNotificationsContext';

export function useSellerNotifications() {
  if (typeof window !== 'undefined') {
    console.debug('[useSellerNotifications] about to read context', {
      reactVersion: React.version,
      sameReactAsBootstrap: window.__DLEVA_REACT__ === React,
      hasProviderValueShape: Boolean(SellerNotificationsContext),
    });
  }

  const context = React.useContext(SellerNotificationsContext);

  if (!context) {
    console.warn('[useSellerNotifications] context missing after useContext call');
    throw new Error(
      'useSellerNotifications must be used within SellerNotificationsProvider'
    );
  }

  return context;
}

export default useSellerNotifications;
