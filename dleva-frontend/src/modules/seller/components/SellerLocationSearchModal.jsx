/**
 * SellerLocationSearchModal
 * 
 * Address search modal for sellers to select their restaurant location.
 * Uses the same address search service as buyers with automatic geocoding.
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, MapPin, X, Navigation, ChevronRight } from 'lucide-react';
import addressSearchService from '../../../services/addressSearchService';
import { logError } from '../../../utils/errorHandler';

const SellerLocationSearchModal = ({
  isOpen,
  onClose,
  onLocationSelected,
  isModal = true,
  confirmLabel = 'Confirm Location',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Handle GPS location detection
  const handleUseCurrentLocation = async () => {
    try {
      setGpsLoading(true);
      setGpsError(null);

      // Get GPS coordinates
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Check accuracy - if poor quality (> 100 meters), warn user
      if (accuracy > 100) {
        setGpsError(
          `GPS accuracy is low (±${Math.round(accuracy)}m). Consider searching manually for better accuracy.`
        );
      }

      // Reverse geocode to get address
      const addressData = await addressSearchService.reverseGeocode(latitude, longitude);

      if (addressData && addressData.display_name) {
        // Set selected location for confirmation
        setSelectedLocation({
          address: addressData.display_name,
          latitude,
          longitude,
        });
        setSearchQuery('');
        setResults([]);
        setError(null);
      } else {
        setGpsError('Could not find address for your location. Please search manually.');
      }
    } catch (err) {
      let errorMessage = 'Failed to get your location';
      
      if (err.code === 1) {
        errorMessage = 'Location permission denied. Please enable in browser settings.';
      } else if (err.code === 2) {
        errorMessage = 'Unable to retrieve your location. Please try again.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }

      setGpsError(errorMessage);
      logError(err, { context: 'SellerLocationSearchModal.handleUseCurrentLocation' });
    } finally {
      setGpsLoading(false);
    }
  };
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear results if query is empty
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // Use debounced search with callback
    addressSearchService.debounceSearch(query, (searchResults) => {
      setResults(searchResults);
      setLoading(false);
      if (searchResults.length === 0) {
        setError('No locations found. Try a different search.');
      } else {
        setError(null);
      }
    }, 400);
    setLoading(true);
  };

  // Handle result selection
  const handleSelectResult = async (result) => {
    try {
      // Extract coordinates and address from result
      const latitude = parseFloat(result.latitude);
      const longitude = parseFloat(result.longitude);
      const address = result.display_name;

      if (!address || isNaN(latitude) || isNaN(longitude)) {
        setError('Invalid location data. Please try again.');
        return;
      }

      // Set selected location instead of immediately calling callback
      setSelectedLocation({
        address,
        latitude,
        longitude,
      });

      // Clear search
      setSearchQuery('');
      setResults([]);
      setError(null);
    } catch (err) {
      logError(err, { context: 'SellerLocationSearchModal.handleSelectResult' });
      setError('Failed to confirm location. Please try again.');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    setSaveLoading(true);
    try {
      const saved = await onLocationSelected(selectedLocation);
      if (saved === false) return;
      setSearchQuery('');
      setResults([]);
      setError(null);
      setGpsError(null);
      setSelectedLocation(null);
      onClose();
    } catch (err) {
      logError(err, { context: 'SellerLocationSearchModal.handleConfirmLocation' });
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
          <h1 className="text-xl font-bold text-dark">Store location</h1>
          {isModal && (
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
              {loading ? (
                <Loader2 size={18} className="text-muted animate-spin flex-shrink-0" />
              ) : (
                <Search size={18} className="text-muted flex-shrink-0" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Enter store address"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm text-dark placeholder-muted focus:outline-none"
              />
              {searchQuery.length > 0 && (
                <button
                  onClick={() => { setSearchQuery(''); setResults([]); }}
                  className="text-muted hover:text-dark transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark truncate">
                          {result.display_name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {error && searchQuery && (
              <div className="flex items-center gap-2 text-red-600 text-xs mt-2 px-1">
                <AlertCircle size={14} />
                {error}
              </div>
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
                <Loader2 size={20} className="text-primary animate-spin" />
              ) : (
                <Navigation size={20} className="text-primary" />
              )}
            </div>
            <span className="text-sm font-semibold text-primary">
              {gpsLoading ? 'Getting location...' : 'Use your current location'}
            </span>
          </button>

          {gpsError && (
            <div className="flex items-start gap-3 mx-1 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{gpsError}</p>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-1" />

          {/* Results Section */}
          {!selectedLocation && searchQuery && results.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="text-gray-300 mb-2" size={32} />
              <p className="text-gray-500 font-medium text-sm">No locations found</p>
            </div>
          )}

          {!selectedLocation && results.length > 0 && (
            <div className="pt-1 space-y-0">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-start gap-4 px-1 py-3.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <MapPin size={20} className="text-dark flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark leading-snug">
                      {result.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

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
                    {confirmLabel}
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

export default SellerLocationSearchModal;
