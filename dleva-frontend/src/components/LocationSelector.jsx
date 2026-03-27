/**
 * Location Selector Component (Top Bar)
 * Quick location display with option to open full location setup
 * 
 * Features:
 * - Shows current location or "Set Location"
 * - Opens LocationSetupModal on click to change location
 * - Uses the new clean location system
 */

import React from 'react';
import useLocation from '../hooks/useLocation';
import { MapPin, ChevronDown } from 'lucide-react';

const LocationSelector = () => {
  const { currentLocation, openLocationSetup } = useLocation();

  // Truncate address if too long
  let displayAddress = 'Set Location';
  if (currentLocation?.address) {
    displayAddress = currentLocation.address.length > 40
      ? currentLocation.address.substring(0, 37) + '...'
      : currentLocation.address;
  }

  return (
    <button
      onClick={openLocationSetup}
      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition min-h-[44px] max-w-[200px]"
      title={currentLocation?.address || 'Click to set location'}
    >
      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
      <span className="text-xs sm:text-sm font-medium truncate">
        {displayAddress}
      </span>
      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  );
};

export default LocationSelector;
