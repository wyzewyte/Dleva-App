/**
 * Location Search Modal
 * Allows users to search for addresses with autocomplete
 */

import React, { useState, useEffect } from 'react';
import useLocation from '../hooks/useLocation';
import addressSearchService from '../services/addressSearchService';
import { logError } from '../utils/errorHandler';

const LocationSearchModal = () => {
  const { setLocationFromAddress, locationSearchOpen, setLocationSearchOpen } =
    useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  /**
   * Search addresses
   */
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    setSelectedIndex(-1);

    try {
      // Use addressSearchService for address search (same as buyer address search)
      const results = await addressSearchService.searchAddresses(searchQuery);

      if (results && results.length > 0) {
        setSearchResults(results);
      } else {
        setSearchResults([]);
        setError('No results found');
      }
    } catch (err) {
      logError(err, { context: 'LocationSearchModal.performSearch' });
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = async (result) => {
    try {
      await setLocationFromAddress(
        result.display_name || result.address,
        parseFloat(result.latitude),
        parseFloat(result.longitude),
        result.city,
        result.area
      );
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      logError(err, { context: 'LocationSearchModal.handleSelectLocation' });
      setError('Failed to set location');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(Math.min(selectedIndex + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(Math.max(selectedIndex - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleSelectLocation(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setLocationSearchOpen(false);
    }
  };

  if (!locationSearchOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Search Address
          </h2>
          <input
            type="text"
            placeholder="Enter address or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-6 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2">Searching...</p>
            </div>
          )}

          {error && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((result, index) => (
                <li
                  key={`${result.latitude}-${result.longitude}`}
                  className={`p-4 cursor-pointer transition ${
                    index === selectedIndex
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectLocation(result)}
                >
                  <div className="font-medium text-gray-800">
                    {result.display_name || result.address}
                  </div>
                  {(result.city || result.area) && (
                    <div className="text-sm text-gray-500 mt-1">
                      {[result.area, result.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && searchResults.length === 0 && searchQuery.length > 2 && !error && (
            <div className="p-6 text-center text-gray-500">
              <p>No results found</p>
              <p className="text-sm mt-2">Try a different search</p>
            </div>
          )}

          {searchQuery.length <= 2 && searchResults.length === 0 && (
            <div className="p-6 text-center text-gray-400">
              <p>Type at least 3 characters to search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={() => setLocationSearchOpen(false)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSearchModal;
