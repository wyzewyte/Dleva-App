import { useState, useCallback } from 'react';
import addressSearchService from '../services/addressSearchService';

/**
 * Custom hook for address operations
 * Provides methods for searching, validating, and reverse geocoding addresses
 * 
 * @returns {Object} Address operations and state
 */
export function useAddressSearch() {
  const [address, setAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search for addresses
  const searchAddresses = useCallback(async (query, limit = 5) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await addressSearchService.searchAddresses(query, limit);
      return results;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reverse geocode coordinates
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await addressSearchService.reverseGeocode(
        latitude,
        longitude
      );

      if (result) {
        setAddress(result);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate address
  const validateAddress = useCallback(async (addressText) => {
    setIsLoading(true);
    setError(null);

    try {
      const { valid, data } = await addressSearchService.validateAddress(
        addressText
      );

      if (valid && data) {
        setAddress(data);
      } else if (!valid && data?.message) {
        setError(data.message);
      }

      return { valid, data };
    } catch (err) {
      setError(err.message);
      return { valid: false, data: null };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Geocode address to coordinates
  const geocodeAddress = useCallback(async (addressText) => {
    setIsLoading(true);
    setError(null);

    try {
      const coords = await addressSearchService.geocodeAddress(addressText);
      return coords;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear current address
  const clearAddress = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return {
    address,
    isLoading,
    error,
    searchAddresses,
    reverseGeocode,
    validateAddress,
    geocodeAddress,
    clearAddress,
    setAddress,
  };
}

/**
 * Custom hook for address form state
 * Manages address from selection with validation
 * 
 * @param {Object} initialAddress - Initial address state
 * @returns {Object} Address form state and handlers
 */
export function useAddressForm(initialAddress = null) {
  const [addressForm, setAddressForm] = useState({
    display_name: initialAddress?.display_name || '',
    latitude: initialAddress?.latitude || null,
    longitude: initialAddress?.longitude || null,
    address_type: initialAddress?.address_type || '',
    importance: initialAddress?.importance || 0,
    raw: initialAddress?.raw || null,
  });

  const [isValid, setIsValid] = useState(false);

  // Update address
  const updateAddress = useCallback((newAddress) => {
    setAddressForm({
      display_name: newAddress.display_name || newAddress.address || '',
      latitude: newAddress.latitude,
      longitude: newAddress.longitude,
      address_type: newAddress.type || newAddress.address_type || '',
      importance: newAddress.importance || 0,
      raw: newAddress.raw || newAddress,
    });

    // Mark as valid if has required fields
    setIsValid(
      !!(
        newAddress.latitude &&
        newAddress.longitude &&
        newAddress.display_name
      )
    );
  }, []);

  // Clear address
  const clearAddress = useCallback(() => {
    setAddressForm({
      display_name: '',
      latitude: null,
      longitude: null,
      address_type: '',
      importance: 0,
      raw: null,
    });
    setIsValid(false);
  }, []);

  // Get form data
  const getFormData = useCallback(() => {
    return {
      address: addressForm.display_name,
      latitude: addressForm.latitude,
      longitude: addressForm.longitude,
      address_type: addressForm.address_type,
    };
  }, [addressForm]);

  return {
    addressForm,
    isValid,
    updateAddress,
    clearAddress,
    getFormData,
  };
}

export default useAddressSearch;
