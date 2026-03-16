import React, { useState, useRef, useEffect } from 'react';
import addressSearchService from '../../services/addressSearchService';

/**
 * AddressSearchComponent
 * Autocomplete search input for address selection
 * 
 * Props:
 * - onSelect: Callback when address is selected
 * - placeholder: Input placeholder text
 * - initialValue: Initial address value
 * - disabled: Disabled state
 */
export default function AddressSearchComponent({
  onSelect,
  placeholder = 'Search address...',
  initialValue = '',
  disabled = false,
}) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Handle search with debounce
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    addressSearchService.debounceSearch(
      query,
      (searchResults) => {
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(-1);
        setIsLoading(false);
      },
      300
    );
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectAddress(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Handle address selection
  const handleSelectAddress = (address) => {
    setQuery(address.display_name);
    setIsOpen(false);
    setResults([]);
    setSelectedIndex(-1);

    // Call parent callback
    if (onSelect) {
      onSelect({
        address: address.display_name,
        latitude: parseFloat(address.latitude),
        longitude: parseFloat(address.longitude),
        type: address.address_type,
        importance: address.importance,
        raw: address,
      });
    }
  };

  // Format address for display
  const formatAddressPreview = (address) => {
    const parts = address.display_name?.split(',') || [];
    // Show first 2 parts for preview
    return parts.slice(0, 2).join(',').trim();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full"></div>
          </div>
        )}

        {/* Clear Button */}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((address, index) => (
            <button
              key={`${address.latitude}_${address.longitude}`}
              onClick={() => handleSelectAddress(address)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-orange-50 transition ${
                index === selectedIndex ? 'bg-orange-50' : ''
              }`}
              type="button"
            >
              {/* Address Icon + Name */}
              <div className="flex items-start gap-3">
                <div className="text-orange-500 flex-shrink-0 mt-0.5">📍</div>
                <div className="flex-1 min-w-0">
                  {/* Full Address */}
                  <p className="font-medium text-gray-800 truncate">
                    {formatAddressPreview(address)}
                  </p>
                  {/* Full Display Name (if different) */}
                  <p className="text-sm text-gray-500 truncate">
                    {address.display_name}
                  </p>
                  {/* Coordinates + Type */}
                  <div className="flex gap-2 text-xs text-gray-400 mt-1">
                    <span>{address.address_type}</span>
                    {address.importance && (
                      <>
                        <span>•</span>
                        <span>
                          Relevance:{' '}
                          {Math.round(address.importance * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && results.length === 0 && query.length >= 3 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <p className="text-center text-gray-500 text-sm">
            No addresses found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
