/**
 * LocationSetupModal Component
 *
 * Can be rendered as:
 * 1. Full page (in LocationSetup.jsx)
 * 2. Modal overlay (when location is required during flow)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2, Navigation, AlertCircle, Clock, ChevronRight, X, PlusCircle } from 'lucide-react';
import useLocation from '../../../hooks/useLocation';
import addressSearchService from '../../../services/addressSearchService';
import { saveUserLocation, getRecentLocations } from '../../../services/location';
import locationManager from '../../../services/locationManager';
import { logError } from '../../../utils/errorHandler';

const normalizeLocationOption = (location) => {
  if (!location || typeof location !== 'object') {
    return null;
  }

  const addressValue =
    typeof location.address === 'string'
      ? location.address
      : location.address?.display_name || location.address?.address || location.display_name || '';

  return {
    ...location,
    address: addressValue || 'Selected location',
    area:
      typeof location.area === 'string'
        ? location.area
        : location.area?.name || location.city || '',
  };
};

const LocationSetupModal = ({ message = null, isModal = true, onClose = null }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);

  // Location state
  const [recentLocations, setRecentLocations] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Save state
  const [saveLoading, setSaveLoading] = useState(false);

  const { setLocationFromAddress, closeLocationSetup } = useLocation();

  // Load recent locations on mount
  useEffect(() => {
    loadRecentLocations();
  }, []);

  const loadRecentLocations = async () => {
    const token = localStorage.getItem('buyer_access_token');
    
    // Always try to load guest location first
    const guestLocation = localStorage.getItem('dleva_guest_delivery_location');
    if (guestLocation) {
      try {
        setRecentLocations([normalizeLocationOption(JSON.parse(guestLocation))].filter(Boolean));
        setRecentLoading(false);
        return; // Don't fetch from API for guests
      } catch (error) {
        logError(error, { context: 'LocationSetupModal.parseGuestLocation' });
      }
    }
    
    // Only fetch from API if user is logged in
    if (!token) {
      setRecentLoading(false);
      return;
    }

    try {
      setRecentLoading(true);
      const response = await getRecentLocations('buyer_delivery', 5);
      setRecentLocations((response.locations || []).map(normalizeLocationOption).filter(Boolean));
    } catch (error) {
      logError(error, { context: 'LocationSetupModal.loadRecentLocations' });
      setRecentLocations([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const performSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const results = await addressSearchService.searchAddresses(searchQuery);
      setSearchResults((results || []).map(normalizeLocationOption).filter(Boolean));
      setShowSearchResults(true);
    } catch (error) {
      logError(error, { context: 'LocationSetupModal.performSearch' });
      setSearchError('Failed to search addresses');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchTimeout = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [performSearch, searchQuery]);

  const handleSelectLocation = (location) => {
    setSelectedLocation(normalizeLocationOption(location));
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);

    try {
      const gpsLocation = await locationManager.requestGPSLocation();

      try {
        const addressData = await locationManager.reverseGeocode(
          gpsLocation.latitude,
          gpsLocation.longitude
        );

        const location = {
          address: addressData.display_name || addressData.address || 'Current Location',
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          city: addressData.city,
          area: addressData.area,
        };

        setSelectedLocation(normalizeLocationOption(location));
      } catch (reverseGeoError) {
        setGpsError('Could not find address for this location. Please search for your address instead.');
        logError(reverseGeoError, { context: 'LocationSetupModal.reverseGeocode' });
      }
    } catch (error) {
      const errorMessage =
        error.code === 'PERMISSION_DENIED'
          ? 'Location permission denied. Please enable in settings.'
          : error.code === 'TIMEOUT'
            ? 'Location request timed out. Please move to an open area and try again.'
            : error.code === 'GEO_NOT_SUPPORTED'
              ? 'Geolocation not supported on this device.'
              : error.code === 'INSECURE_CONTEXT'
                ? 'Location access requires a secure HTTPS connection in production.'
              : error.message || 'Failed to get location';

      setGpsError(errorMessage);
      logError(error, { context: 'LocationSetupModal.handleUseCurrentLocation' });
    } finally {
      setGpsLoading(false);
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    setSaveLoading(true);

    try {
      const token = localStorage.getItem('buyer_access_token');

      if (token) {
        // Logged-in user: save to backend
        await saveUserLocation({
          locationType: 'buyer_delivery',
          address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          city: selectedLocation.city,
          area: selectedLocation.area,
        });

        // Clear guest cart if user is logged in
        localStorage.removeItem('dleva_cart');
      } else {
        // Guest user: save only to localStorage AND update context
        localStorage.setItem('dleva_guest_delivery_location', JSON.stringify(selectedLocation));
      }

      // Update the location context (works for both guests and logged-in users)
      await setLocationFromAddress(
        selectedLocation.address,
        selectedLocation.latitude,
        selectedLocation.longitude,
        selectedLocation.city,
        selectedLocation.area
      );

      // Close modal using context
      closeLocationSetup();

      // If modal, also call onClose callback
      if (isModal && onClose) {
        onClose();
      }
    } catch (error) {
      logError(error, { context: 'LocationSetupModal.handleConfirmLocation' });
      alert('Failed to save location. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const clearSelectedLocation = () => {
    setSelectedLocation(null);
  };

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-50 bg-surface flex flex-col sm:bg-black sm:bg-opacity-50 sm:items-center sm:justify-center sm:p-4'
          : 'min-h-screen bg-bg flex flex-col'
      }
    >
      <div className="bg-surface w-full flex-1 flex flex-col sm:flex-none sm:max-w-lg sm:rounded-2xl sm:shadow-lg sm:overflow-hidden overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h1 className="text-xl font-bold text-dark">
            {message ? 'Address' : 'Delivery address'}
          </h1>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={18} className="text-dark" />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="px-5 pb-6 flex-1 overflow-y-auto space-y-1 sm:max-h-[80vh]">

          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl">
              {searchLoading ? (
                <Loader2 size={18} className="text-muted animate-spin flex-shrink-0" />
              ) : (
                <Search size={18} className="text-muted flex-shrink-0" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Enter a new address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className="flex-1 bg-transparent text-sm text-dark placeholder-muted focus:outline-none"
              />
              {searchQuery.length > 0 && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                  className="text-muted hover:text-dark transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark truncate">
                          {result.display_name || result.address}
                        </p>
                        {result.area && (
                          <p className="text-xs text-muted">{result.area}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <div className="flex items-center gap-2 text-danger text-xs mt-2 px-1">
                <AlertCircle size={14} />
                {searchError}
              </div>
            )}

            {searchQuery.trim().length > 0 && !showSearchResults && !searchLoading && searchResults.length === 0 && (
              <p className="text-xs text-muted mt-2 px-1">No results found</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-1" />

          {/* Use Current Location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="w-full flex items-center gap-4 px-1 py-3.5 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              {gpsLoading ? (
                <Loader2 size={22} className="text-primary animate-spin" />
              ) : (
                <Navigation size={22} className="text-primary" />
              )}
            </div>
            <span className="text-sm font-semibold text-primary">
              {gpsLoading ? 'Getting location...' : 'Use your current location'}
            </span>
          </button>

          {gpsError && (
            <div className="flex items-start gap-3 mx-1 p-3 bg-danger bg-opacity-10 rounded-lg border border-danger border-opacity-20">
              <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{gpsError}</p>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-1" />

          {/* Save New Address */}
          <button
            onClick={() => {
              setSearchQuery('');
              setShowSearchResults(false);
              setSelectedLocation(null);
              searchInputRef.current?.focus();
            }}
            className="w-full flex items-center gap-4 px-1 py-3.5 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <MapPin size={22} className="text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary">Save new address</span>
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-1" />

          {/* Recent / Saved Locations */}
          {recentLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="text-muted animate-spin" />
            </div>
          ) : recentLocations.length > 0 ? (
            <div className="pt-1 space-y-0">
              {recentLocations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(location)}
                  className={`w-full flex items-start gap-4 px-1 py-3.5 hover:bg-gray-50 rounded-xl transition-colors text-left ${
                    selectedLocation?.address === location.address
                      ? 'bg-primary bg-opacity-5'
                      : ''
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin
                      size={20}
                      className={`${
                        selectedLocation?.address === location.address
                          ? 'text-primary'
                          : 'text-dark'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark leading-snug">
                      {location.address}
                    </p>
                    {location.area && (
                      <p className="text-xs text-muted mt-0.5">{location.area}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {/* Selected Location Confirmation Banner */}
          {selectedLocation && (
            <>
              <div className="h-px bg-gray-100 mx-1" />
              <div className="mx-1 mt-2 p-4 bg-primary bg-opacity-5 border border-primary border-opacity-20 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide">Selected</p>
                    <p className="text-sm font-bold text-dark leading-snug mt-0.5">
                      {selectedLocation.address}
                    </p>
                    {selectedLocation.area && (
                      <p className="text-xs text-muted mt-0.5">{selectedLocation.area}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearSelectedLocation}
                  className="mt-3 text-xs text-primary font-semibold hover:text-primary-hover transition-colors"
                >
                  Change Location
                </button>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmLocation}
                disabled={saveLoading}
                className="w-full mt-3 bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    Start Ordering Food
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSetupModal;
