/**
 * useLocation Hook - Easy access to location context
 * Use this hook in any component to access location functionality
 */

import * as React from 'react';
import LocationContext from '../context/LocationContextObject';

export const useLocation = () => {
  if (typeof window !== 'undefined') {
    console.debug('[useLocation] about to read context', {
      reactVersion: React.version,
      sameReactAsBootstrap: window.__DLEVA_REACT__ === React,
      hasProviderValueShape: Boolean(LocationContext),
    });
  }

  const context = React.useContext(LocationContext);

  if (!context) {
    console.warn('[useLocation] context missing after useContext call');
    throw new Error('useLocation must be used within LocationProvider');
  }

  return context;
};

export default useLocation;
