/**
 * LocationSetup Page
 * 
 * Page for initial/manual location setup during buyer onboarding or anytime they want to change location.
 * Uses LocationSetupModal component as full page (not modal mode)
 */

import { useNavigate } from 'react-router-dom';
import LocationSetupModal from '../../components/LocationSetupModal';
import { useEffect } from 'react';
import { useAuth } from '../../../../modules/auth/context/AuthContext';

const LocationSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user already has location and they're logged in, redirect to home
  useEffect(() => {
    const currentLocation = localStorage.getItem('currentLocation');
    if (currentLocation && user) {
      // They already have a location set, redirect to home
      // (They can still access this page to manually change location)
    }
  }, [user, navigate]);

  const handleLocationSaved = () => {
    navigate('/home');
  };

  return (
    <LocationSetupModal 
      isModal={false} 
      onClose={handleLocationSaved}
    />
  );
};

export default LocationSetup;
