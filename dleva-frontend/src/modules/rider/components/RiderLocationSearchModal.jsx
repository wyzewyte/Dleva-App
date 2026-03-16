/**
 * RiderLocationSearchModal
 * Address search modal for riders to set their current location
 * Matches buyer/seller implementation pattern
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, MapPin, X, Navigation } from 'lucide-react';
import addressSearchService from '../../../services/addressSearchService';

const RiderLocationSearchModal = ({ isOpen, onClose, onLocationSelected }) => {
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
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Select Your Location</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {/* GPS Button */}
          <div className="p-4 border-b">
            <button
              onClick={handleUseCurrentLocation}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded-lg py-2 px-3 font-medium transition-colors disabled:opacity-50"
            >
              {gpsLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Finding location...
                </>
              ) : (
                <>
                  <Navigation size={18} />
                  Use Current Location
                </>
              )}
            </button>
            
            {gpsError && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-300 rounded text-sm text-orange-700 flex gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search address or area..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-4 flex items-center justify-center gap-2 text-gray-600">
              <Loader2 size={18} className="animate-spin" />
              Searching locations...
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="p-4 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !loading && (
            <div className="divide-y">
              {results.map((result, index) => (
                <button
                  key={`${result.latitude}-${result.longitude}`}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <MapPin size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{result.display_name}</p>
                    <p className="text-xs text-gray-500">
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && searchQuery && !error && (
            <div className="p-8 text-center text-gray-500">
              <MapPin size={32} className="mx-auto mb-2 opacity-50" />
              <p>No locations found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}

          {/* Help Text */}
          {!loading && results.length === 0 && !searchQuery && (
            <div className="p-6 text-center text-gray-500">
              <MapPin size={32} className="mx-auto mb-2 opacity-50" />
              <p className="font-medium">Search for your location</p>
              <p className="text-sm mt-1">Enter a street address, area name, or landmark</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderLocationSearchModal;
