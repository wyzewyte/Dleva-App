/**
 * Location Context - Global Location State Management
 * Provides location data and methods to entire app via React Context
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import locationManager from '../services/locationManager';
import { logError } from '../utils/errorHandler';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  // Location state
  const [currentLocation, setCurrentLocation] = useState(
    locationManager.getCurrentLocation()
  );
  const [recentLocations, setRecentLocations] = useState(
    locationManager.getRecentLocations()
  );
  const [locationType, setLocationType] = useState('buyer_delivery');

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // UI state
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);

  // Subscribe to location manager changes
  useEffect(() => {
    const unsubscribe = locationManager.subscribe((location) => {
      setCurrentLocation(location);
      setRecentLocations(locationManager.getRecentLocations());
    });

    return unsubscribe;
  }, []);

  /**
   * Request GPS location
   */
  const requestGPSLocation = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);

    try {
      const gpsLocation = await locationManager.requestGPSLocation();

      // Reverse geocode to get address
      try {
        const addressData = await locationManager.reverseGeocode(
          gpsLocation.latitude,
          gpsLocation.longitude
        );

        // addressData is the address object with display_name property
        const locationToSave = {
          address: addressData.display_name || addressData.address || 'Current Location',
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          city: addressData.city,
          area: addressData.area,
          accuracy: gpsLocation.accuracy,
        };

        await locationManager.setLocation(locationToSave, locationType);
        
        // Explicitly update currentLocation state to ensure UI updates immediately
        setCurrentLocation(locationToSave);
        setRecentLocations(locationManager.getRecentLocations());
        
        setGpsLoading(false);
        return locationToSave;
      } catch (reverseGeoError) {
        // Reverse geocode failed, but we have GPS coords
        // Don't store coordinates as address - require manual entry instead
        // User should select an address from search results for a valid delivery location
        const error = new Error('Unable to determine address from GPS. Please search and select an address.');
        error.code = 'REVERSE_GEOCODE_FAILED';
        error.hasCoordinates = true;
        error.coordinates = {
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          accuracy: gpsLocation.accuracy,
        };
        setGpsError({
          code: 'REVERSE_GEOCODE_FAILED',
          message: 'Could not find address for this location. Please search for your address instead.',
          coordinates: error.coordinates,
        });
        setGpsLoading(false);
        throw error;
      }
    } catch (error) {
      const errorMessage =
        error.code === 'PERMISSION_DENIED'
          ? 'Location permission denied. Please enable in settings.'
          : error.code === 'TIMEOUT'
            ? 'Location request timed out. Please try again.'
            : error.code === 'GEO_NOT_SUPPORTED'
              ? 'Geolocation not supported on this device.'
              : error.message || 'Failed to get location';

      setGpsError({
        code: error.code,
        message: errorMessage,
      });
      setGpsLoading(false);
      throw error;
    }
  }, [locationType]);

  /**
   * Set location from address search
   */
  const setLocationFromAddress = useCallback(
    async (address, latitude, longitude, city, area) => {
      try {
        const location = {
          address,
          latitude,
          longitude,
          city,
          area,
        };

        await locationManager.setLocation(location, locationType);
        setLocationSearchOpen(false);
        return location;
      } catch (error) {
        logError(error, { context: 'setLocationFromAddress' });
        throw error;
      }
    },
    [locationType]
  );

  /**
   * Set location from recent locations
   */
  const setLocationFromRecent = useCallback(async (location) => {
    try {
      await locationManager.setLocation(location, 'buyer_delivery');
      setLocationSelectorOpen(false);
      return location;
    } catch (error) {
      logError(error, { context: 'setLocationFromRecent' });
      throw error;
    }
  }, []);

  /**
   * Get nearby restaurants
   */
  const getNearbyRestaurants = useCallback(
    async (options = {}) => {
      if (!currentLocation) {
        throw new Error('Location not set');
      }

      return locationManager.getNearbyRestaurants(currentLocation, options);
    },
    [currentLocation]
  );

  /**
   * Estimate delivery fee
   */
  const estimateDeliveryFee = useCallback(
    async (deliveryLocation) => {
      if (!currentLocation) {
        throw new Error('Current location not set');
      }

      return locationManager.estimateDeliveryFee(
        currentLocation,
        deliveryLocation
      );
    },
    [currentLocation]
  );

  /**
   * Change location type
   */
  const changeLocationType = useCallback((newType) => {
    setLocationType(newType);
    locationManager.locationType = newType;
  }, []);

  /**
   * Clear location
   */
  const clearLocation = useCallback(() => {
    locationManager.clearLocation();
    setCurrentLocation(null);
  }, []);

  const value = {
    // Location state
    currentLocation,
    recentLocations,
    locationType,

    // GPS operations
    requestGPSLocation,
    gpsLoading,
    gpsError,

    // Location operations
    setLocationFromAddress,
    setLocationFromRecent,
    getNearbyRestaurants,
    estimateDeliveryFee,
    changeLocationType,
    clearLocation,

    // UI state
    locationSelectorOpen,
    setLocationSelectorOpen,
    locationSearchOpen,
    setLocationSearchOpen,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
