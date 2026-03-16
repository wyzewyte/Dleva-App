/**
 * Location Selector Component (Top Bar)
 * Persistent top-bar location selector with GPS and address search
 */

import React, { useState } from 'react';
import useLocation from '../hooks/useLocation';
import LocationSearchModal from './LocationSearchModal';
import { logError } from '../utils/errorHandler';
import buyerProfile from '../services/buyerProfile';

const LocationSelector = () => {
  const locationContext = useLocation();
  
  const {
    currentLocation = null,
    recentLocations = [],
    requestGPSLocation = async () => {},
    gpsLoading = false,
    gpsError = null,
    setLocationFromRecent = async () => {},
    setLocationSearchOpen = () => {},
    locationSelectorOpen = false,
    setLocationSelectorOpen = () => {},
  } = locationContext || {};

  const [showDropdown, setShowDropdown] = useState(false);
  const [gpsErrorLocal, setGpsErrorLocal] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGPSClick = async () => {
    setGpsErrorLocal(null);
    setGpsSuccess(false);

    try {
      await requestGPSLocation();
      // Show success feedback
      setGpsSuccess(true);
      
      // Close dropdown after brief delay to let user see the location was set
      setTimeout(() => {
        setGpsSuccess(false);
        setShowDropdown(false);
      }, 1500);
    } catch (error) {
      setGpsErrorLocal(
        error.message ||
          'Failed to get location. Please check permissions and try again.'
      );
      logError(error, { context: 'LocationSelector.handleGPSClick' });
    }
  };

  const handleRecentLocationClick = async (location) => {
    try {
      await setLocationFromRecent(location);
      setShowDropdown(false);
    } catch (error) {
      logError(error, { context: 'LocationSelector.handleRecentLocationClick' });
    }
  };

  const openSearchModal = () => {
    setShowDropdown(false);
    setLocationSearchOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!currentLocation) {
      setGpsErrorLocal('Please select a location first');
      return;
    }

    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      await buyerProfile.updateLocation(
        currentLocation.latitude,
        currentLocation.longitude,
        currentLocation.address
      );
      
      setSaveSuccess(true);
      setSaveLoading(false);
      
      // Clear success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
      
      // Close dropdown after saving
      setTimeout(() => setShowDropdown(false), 500);
    } catch (error) {
      setGpsErrorLocal(error.error || 'Failed to save location');
      setSaveLoading(false);
      logError(error, { context: 'LocationSelector.handleSaveLocation' });
    }
  };

  // Truncate location address if too long
  let displayAddress = 'Set Location';
  if (currentLocation && currentLocation.address) {
    let addressText = '';
    if (typeof currentLocation.address === 'string') {
      addressText = currentLocation.address;
    } else if (currentLocation.address.display_name) {
      addressText = currentLocation.address.display_name;
    }
    
    if (addressText) {
      displayAddress = addressText.length > 40
        ? addressText.substring(0, 37) + '...'
        : addressText;
    }
  }

  return (
    <>
      <div className="relative">
        {/* Main Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition min-h-[44px]"
          title={typeof currentLocation?.address === 'string' 
            ? currentLocation.address 
            : currentLocation?.address?.display_name || 'Click to set location'}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[180px]">{displayAddress}</span>
          <svg
            className={`w-4 h-4 transition transform flex-shrink-0 ${
              showDropdown ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full left-2 right-2 mt-3 md:left-0 md:right-auto md:w-80 lg:w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-[70vh] overflow-y-auto overflow-x-hidden">
            {/* GPS Success Display */}
            {gpsSuccess && (
              <div className="p-2 sm:p-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs sm:text-sm text-green-700 font-medium">Location detected and saved!</p>
              </div>
            )}

            {/* GPS Error Display */}
            {(gpsError || gpsErrorLocal) && (
              <div className="p-2 sm:p-3 bg-red-50 border-b border-red-200">
                <p className="text-xs sm:text-sm text-red-700">
                  {gpsErrorLocal || gpsError?.message}
                </p>
              </div>
            )}

            {/* GPS Button */}
            <button
              onClick={handleGPSClick}
              disabled={gpsLoading}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 border-b border-gray-100 transition flex items-center gap-2 sm:gap-3 disabled:opacity-70 disabled:cursor-not-allowed min-h-[44px]"
            >
              {gpsLoading ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              )}
              <div className="min-w-0">
                <div className="font-medium text-gray-800 text-xs sm:text-sm">
                  {gpsLoading ? 'Getting Location...' : 'Use Current Location'}
                </div>
                <div className="text-xs text-gray-500">GPS detection</div>
              </div>
            </button>

            {/* Search Button */}
            <button
              onClick={openSearchModal}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 border-b border-gray-100 transition flex items-center gap-2 sm:gap-3 min-h-[44px]"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <div className="min-w-0">
                <div className="font-medium text-gray-800 text-xs sm:text-sm">Search Address</div>
                <div className="text-xs text-gray-500">Find by name</div>
              </div>
            </button>

            {/* Recent Locations */}
            {Array.isArray(recentLocations) && recentLocations.length > 0 && (
              <>
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase">
                    Recent Locations
                  </h3>
                </div>
                <ul className="max-h-56 overflow-y-auto">
                  {recentLocations.slice(0, 5).map((location) => (
                    <li key={`${location.latitude}-${location.longitude}`}>
                      <button
                        onClick={() => handleRecentLocationClick(location)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition min-h-[44px]"
                      >
                        <div className="font-medium text-gray-800 text-xs sm:text-sm">
                          {typeof location.address === 'string' 
                            ? location.address 
                            : location.address?.display_name || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
                        </div>
                        {(location.city || location.area) && (
                          <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                            {[location.area, location.city]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* No Recent Locations */}
            {recentLocations.length === 0 && (
              <div className="p-2 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
                <p>No recent locations</p>
              </div>
            )}

            {/* Save Location Button */}
            <div className="border-t border-gray-100 p-2 sm:p-3">
              {saveSuccess ? (
                <div className="w-full px-2 sm:px-4 py-2 sm:py-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs sm:text-sm text-center font-medium">
                  ✓ Location saved
                </div>
              ) : (
                <button
                  onClick={handleSaveLocation}
                  disabled={saveLoading || !currentLocation}
                  className="w-full px-2 sm:px-4 py-2 sm:py-2.5 bg-primary text-white rounded font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px]"
                >
                  {saveLoading ? (
                    <>
                      <svg className="w-3 sm:w-4 h-3 sm:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Location
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <LocationSearchModal />

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
};

export default LocationSelector;
