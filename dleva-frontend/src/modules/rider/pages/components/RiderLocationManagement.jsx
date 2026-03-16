/**
 * RiderLocationManagement Component
 * Allows rider to set/update their current location via search or GPS
 * Integrated into Settings page
 */

import React, { useState } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import RiderLocationSearchModal from '../../components/RiderLocationSearchModal';
import riderLocationService from '../../services/riderLocationService';
import addressSearchService from '../../../../services/addressSearchService';

const RiderLocationManagement = ({ profile, onLocationUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({
    address: profile?.address || null,
    latitude: profile?.current_latitude || null,
    longitude: profile?.current_longitude || null,
    accuracy: profile?.location_accuracy || 0,
  });

  const handleLocationSelected = async (locationData) => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      // Validate location data
      if (!locationData || locationData.latitude === null || locationData.longitude === null) {
        throw new Error('Invalid location data received');
      }

      console.log('📍 handleLocationSelected received:', locationData);

      // Update location on backend
      const result = await riderLocationService.updateLocation(
        locationData.latitude,
        locationData.longitude,
        locationData.accuracy || 0
      );

      console.log('✅ Backend response:', result);

      // Update local state
      setCurrentLocation({
        address: locationData.address || null,
        latitude: result.latitude || locationData.latitude,
        longitude: result.longitude || locationData.longitude,
        accuracy: result.accuracy || locationData.accuracy || 0,
      });

      setSuccess('✓ Location updated successfully');
      
      // Notify parent
      if (onLocationUpdate) {
        onLocationUpdate({
          ...locationData,
          address: locationData.address,
          timestamp: new Date()
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Failed to update location:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to update location. Please try again.';
      setError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAutoDetect = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      // Get current location
      const location = await riderLocationService.getCurrentLocation();

      if (!location || location.latitude === null || location.longitude === null) {
        throw new Error('Failed to retrieve valid location coordinates');
      }

      console.log('📍 Auto-detect location retrieved:', location);

      // Reverse geocode to get address
      const addressData = await addressSearchService.reverseGeocode(location.latitude, location.longitude);
      const address = addressData?.display_name || null;
      
      console.log('📍 Reverse geocoded address:', address);

      // Update on backend
      const result = await riderLocationService.updateLocation(
        location.latitude,
        location.longitude,
        location.accuracy
      );

      console.log('✅ Auto-detect update successful:', result);

      // Update local state
      setCurrentLocation({
        address: address || null,
        latitude: result.latitude || location.latitude,
        longitude: result.longitude || location.longitude,
        accuracy: result.accuracy || location.accuracy,
      });

      setSuccess('✓ Location detected and updated successfully');
      
      // Notify parent
      if (onLocationUpdate) {
        onLocationUpdate({
          address: address || null,
          latitude: result.latitude || location.latitude,
          longitude: result.longitude || location.longitude,
          accuracy: result.accuracy || location.accuracy,
          timestamp: new Date()
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      let errorMsg = 'Failed to detect location';
      
      if (err.code === 1) {
        errorMsg = 'Location permission denied. Please enable in Settings > Site Settings > Location';
      } else if (err.code === 2) {
        errorMsg = 'Unable to retrieve your location. Try moving to an open area.';
      } else if (err.code === 3) {
        errorMsg = 'Location request timed out. Please try again.';
      } else if (err.message) {
        errorMsg = err.message;
      } else if (err.response?.data) {
        errorMsg = err.response.data.detail || err.response.data.error || 'Backend error occurred';
      }
      
      setError(errorMsg);
      console.error('❌ Auto-detect error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
      </div>

      {/* Current Location Display */}
      {currentLocation.latitude && currentLocation.longitude ? (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Location Set</p>
              {currentLocation.address ? (
                <p className="text-sm text-gray-900 font-semibold mt-1">{currentLocation.address}</p>
              ) : null}
              <p className="text-sm text-gray-600 mt-1">
                Coordinates: {parseFloat(currentLocation.latitude).toFixed(6)}, {parseFloat(currentLocation.longitude).toFixed(6)}
              </p>
              {currentLocation.accuracy && currentLocation.accuracy > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Accuracy: ±{Math.round(currentLocation.accuracy)}m
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {profile?.last_location_update ? 
                  new Date(profile.last_location_update).toLocaleString() : 
                  'Never'
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">No location set yet</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleAutoDetect}
          disabled={isUpdating}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isUpdating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <MapPin size={18} />
              Auto-Detect Current Location
            </>
          )}
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isUpdating}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <MapPin size={18} />
          Search & Select Location
        </button>
      </div>

      {/* Info Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 Your location is used to calculate delivery distances and help customers find you. Keep it updated for better accuracy.
        </p>
      </div>

      {/* Location Search Modal */}
      <RiderLocationSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLocationSelected={handleLocationSelected}
      />
    </div>
  );
};

export default RiderLocationManagement;
