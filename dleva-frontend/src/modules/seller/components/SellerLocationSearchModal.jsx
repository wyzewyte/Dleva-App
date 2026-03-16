/**
 * SellerLocationSearchModal
 * 
 * Address search modal for sellers to select their restaurant location.
 * Uses the same address search service as buyers with automatic geocoding.
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, MapPin, X, Navigation } from 'lucide-react';
import addressSearchService from '../../../services/addressSearchService';
import { logError } from '../../../utils/errorHandler';

const SellerLocationSearchModal = ({ isOpen, onClose, onLocationSelected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
        // Call parent callback with location
        onLocationSelected({
          address: addressData.display_name,
          latitude,
          longitude,
        });

        // Reset and close
        setSearchQuery('');
        setResults([]);
        setError(null);
        setGpsError(null);
        setSelectedIndex(-1);
        onClose();
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
    setSelectedIndex(-1);

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

      // Call the parent callback with location data
      onLocationSelected({
        address,
        latitude,
        longitude,
      });

      // Reset and close
      setSearchQuery('');
      setResults([]);
      setError(null);
      setSelectedIndex(-1);
      onClose();
    } catch (err) {
      logError(err, { context: 'SellerLocationSearchModal.handleSelectResult' });
      setError('Failed to confirm location. Please try again.');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div
        className="w-full sm:w-[500px] max-h-[600px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          {/* GPS Button */}
          <div className="mb-3">
            <button
              onClick={handleUseCurrentLocation}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              {gpsLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Getting your location...</span>
                </>
              ) : (
                <>
                  <Navigation size={18} />
                  <span>Use Current Location</span>
                </>
              )}
            </button>
          </div>

          {/* GPS Error */}
          {gpsError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="text-red-600 shrink-0" size={18} style={{ marginTop: '2px' }} />
              <p className="text-sm text-red-700">{gpsError}</p>
            </div>
          )}

          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder="Search for your store location..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[500px]">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 flex gap-3 bg-red-50 border-b border-red-200">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && searchQuery && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="text-gray-300 mb-2" size={40} />
              <p className="text-gray-500 font-medium">No locations found</p>
              <p className="text-sm text-gray-400">Try searching with a different address</p>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="divide-y divide-gray-100">
              {results.map((result, index) => (
                <button
                  key={`${result.latitude}-${result.longitude}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full text-left p-4 flex gap-3 transition-colors ${
                    selectedIndex === index
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <MapPin
                    className={selectedIndex === index ? 'text-primary' : 'text-gray-400'}
                    size={20}
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-dark truncate">
                      {result.display_name?.split(',')[0]}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {result.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Idle State */}
          {!loading && results.length === 0 && !searchQuery && (
            <div className="flex flex-col items-center justify-center py-12 text-center p-4">
              <MapPin className="text-gray-300 mb-2" size={40} />
              <p className="text-gray-600 font-medium">Find your store location</p>
              <p className="text-sm text-gray-400">Enter your address to search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerLocationSearchModal;
