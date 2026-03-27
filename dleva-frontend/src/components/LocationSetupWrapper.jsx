/**
 * LocationSetupProvider Wrapper
 * 
 * Wraps the app to provide LocationSetupModal globally
 * Modal can be opened from anywhere by calling openLocationSetup()
 */

import { useState, useEffect } from 'react';
import useLocation from '../hooks/useLocation';
import LocationSetupModal from '../modules/buyer/components/LocationSetupModal';

const LocationSetupWrapper = ({ children }) => {
  const { locationSetupOpen, closeLocationSetup } = useLocation();

  return (
    <>
      {children}
      {locationSetupOpen && (
        <LocationSetupModal 
          isModal={true}
          onClose={closeLocationSetup}
        />
      )}
    </>
  );
};

export default LocationSetupWrapper;
