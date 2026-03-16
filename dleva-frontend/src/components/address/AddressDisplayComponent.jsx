import React, { useState, useEffect } from 'react';
import addressSearchService from '../../services/addressSearchService';

/**
 * AddressDisplayComponent
 * Shows address details with GPS coordinates
 * Can reverse geocode from coordinates or validate an address
 * 
 * Props:
 * - address: Address object {display_name, latitude, longitude, etc}
 * - onUpdate: Callback when address changes
 * - editable: Allow editing
 * - showCoordinates: Show GPS coordinates
 * - allowReverseGeocode: Show button to reverse geocode
 */
export default function AddressDisplayComponent({
  address,
  onUpdate,
  editable = false,
  showCoordinates = true,
  allowReverseGeocode = true,
}) {
  const [displayAddress, setDisplayAddress] = useState(address || {});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDisplayAddress(address || {});
  }, [address]);

  // Handle reverse geocode from coordinates
  const handleReverseGeocode = async () => {
    if (!displayAddress.latitude || !displayAddress.longitude) {
      alert('Coordinates not available');
      return;
    }

    setIsLoading(true);
    try {
      const result = await addressSearchService.reverseGeocode(
        displayAddress.latitude,
        displayAddress.longitude
      );

      if (result) {
        const updated = {
          ...displayAddress,
          ...result,
        };
        setDisplayAddress(updated);

        if (onUpdate) {
          onUpdate(updated);
        }
      } else {
        alert('Could not reverse geocode these coordinates');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Address Display */}
      {displayAddress.display_name && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 text-lg flex-shrink-0">📍</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-medium break-words">
                {displayAddress.display_name}
              </p>
              {displayAddress.address_type && (
                <p className="text-sm text-gray-500">
                  Type: {displayAddress.address_type}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Address Components */}
      {(displayAddress.street ||
        displayAddress.city ||
        displayAddress.state ||
        displayAddress.postcode) && (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700">
            Components
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {displayAddress.street && (
              <div>
                <p className="text-gray-500">Street:</p>
                <p className="text-gray-800">{displayAddress.street}</p>
              </div>
            )}
            {displayAddress.city && (
              <div>
                <p className="text-gray-500">City:</p>
                <p className="text-gray-800">{displayAddress.city}</p>
              </div>
            )}
            {displayAddress.state && (
              <div>
                <p className="text-gray-500">State:</p>
                <p className="text-gray-800">{displayAddress.state}</p>
              </div>
            )}
            {displayAddress.postcode && (
              <div>
                <p className="text-gray-500">Postcode:</p>
                <p className="text-gray-800">{displayAddress.postcode}</p>
              </div>
            )}
            {displayAddress.country && (
              <div>
                <p className="text-gray-500">Country:</p>
                <p className="text-gray-800">{displayAddress.country}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coordinates */}
      {showCoordinates &&
        displayAddress.latitude &&
        displayAddress.longitude && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              GPS Coordinates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Latitude */}
              <div className="bg-gray-50 p-3 rounded space-y-1">
                <p className="text-xs text-gray-500">Latitude</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-gray-800">
                    {displayAddress.latitude.toFixed(6)}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(displayAddress.latitude.toString())
                    }
                    className="text-xs text-gray-400 hover:text-gray-600"
                    title="Copy latitude"
                    type="button"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Longitude */}
              <div className="bg-gray-50 p-3 rounded space-y-1">
                <p className="text-xs text-gray-500">Longitude</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-gray-800">
                    {displayAddress.longitude.toFixed(6)}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(displayAddress.longitude.toString())
                    }
                    className="text-xs text-gray-400 hover:text-gray-600"
                    title="Copy longitude"
                    type="button"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            {/* Reverse Geocode Button */}
            {allowReverseGeocode && editable && (
              <button
                onClick={handleReverseGeocode}
                disabled={isLoading}
                className="w-full mt-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400 text-sm font-medium transition"
                type="button"
              >
                {isLoading
                  ? '🔄 Finding Address...'
                  : '🗺️ Find Address from Coordinates'}
              </button>
            )}
          </div>
        )}

      {/* Importance Score */}
      {displayAddress.importance !== undefined && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Relevance Score</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{
                    width: `${Math.round(displayAddress.importance * 100)}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 w-8">
                {Math.round(displayAddress.importance * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
