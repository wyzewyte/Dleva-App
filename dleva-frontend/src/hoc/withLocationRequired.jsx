/**
 * LocationProtectedWrapper
 * 
 * HOC that ensures a component has a valid location set.
 * If location is not set, renders LocationSetup modal instead.
 * 
 * Usage:
 * const ProtectedHome = withLocationRequired(Home);
 */

import React from 'react';
import useLocation from '../hooks/useLocation';
import LocationSetupModal from '../modules/buyer/components/LocationSetupModal';

export const withLocationRequired = (WrappedComponent, fallbackMessage = null) => {
  return function LocationProtectedComponent(props) {
    const { currentLocation, setLocationSelectorOpen } = useLocation();
    const hasLocation = !!(currentLocation?.latitude && currentLocation?.longitude);

    if (!hasLocation) {
      return <LocationSetupModal message={fallbackMessage} />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withLocationRequired;
