/**
 * Location Context - Global Location State Management
 * Provides location data and methods to entire app via React Context
 * 
 * Key features:
 * - Centralized location state via locationManager
 * - Location-triggered actions are cached in services
 * - UI modes for modal vs page navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import LocationContext from './LocationContextObject';
import locationManager from '../services/locationManager';
import { logError } from '../utils/errorHandler';

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

  // UI state - for opening location setup modal/page
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSetupOpen, setLocationSetupOpen] = useState(false); // For LocationSetupModal

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

        const locationToSave = {
          address: addressData.display_name || addressData.address || 'Current Location',
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          city: addressData.city,
          area: addressData.area,
          accuracy: gpsLocation.accuracy,
        };

        const token = localStorage.getItem('buyer_access_token');

        if (token) {
          // Logged-in user: save to backend
          await locationManager.setLocation(locationToSave, locationType);
        } else {
          // Guest user: save only to localStorage
          localStorage.setItem('dleva_guest_delivery_location', JSON.stringify(locationToSave));
        }
        
        setCurrentLocation(locationToSave);
        setRecentLocations(locationManager.getRecentLocations());
        
        setGpsLoading(false);
        return locationToSave;
      } catch {
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

        const token = localStorage.getItem('buyer_access_token');

        if (token) {
          // Logged-in user: save to backend
          await locationManager.setLocation(location, locationType);
        } else {
          // Guest user: save only to localStorage
          localStorage.setItem('dleva_guest_delivery_location', JSON.stringify(location));
          // Update context state for guest users
          setCurrentLocation(location);
          setRecentLocations(locationManager.getRecentLocations());
        }

        setLocationSearchOpen(false);
        setLocationSetupOpen(false);
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
      const token = localStorage.getItem('buyer_access_token');

      if (token) {
        // Logged-in user: save to backend
        await locationManager.setLocation(location, 'buyer_delivery');
      } else {
        // Guest user: save only to localStorage
        localStorage.setItem('dleva_guest_delivery_location', JSON.stringify(location));
        // Update context state for guest users
        setCurrentLocation(location);
        setRecentLocations(locationManager.getRecentLocations());
      }

      setLocationSelectorOpen(false);
      setLocationSetupOpen(false);
      return location;
    } catch (error) {
      logError(error, { context: 'setLocationFromRecent' });
      throw error;
    }
  }, []);

  /**
   * Get nearby restaurants (with caching in useLocationServices)
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
   * Estimate delivery fee (with caching in useLocationServices)
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

  /**
   * Open location setup (modal or page)
   */
  const openLocationSetup = useCallback(() => {
    setLocationSetupOpen(true);
  }, []);

  /**
   * Close location setup modal
   */
  const closeLocationSetup = useCallback(() => {
    setLocationSetupOpen(false);
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
    locationSetupOpen,
    setLocationSetupOpen,
    openLocationSetup,
    closeLocationSetup,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
