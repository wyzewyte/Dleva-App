/**
 * Rider Authentication Context
 * Manages rider authentication state and operations
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../services/axios';
import riderAuth from '../services/riderAuth';
import MESSAGES from '../../../constants/messages';

/**
 * Extract error message from error object
 */
const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (typeof error === 'string') return error;
  if (error.error) return error.error;
  if (error.message) return error.message;
  return defaultMsg;
};

const defaultRiderAuthContext = {
  token: null,
  rider: null,
  loading: false,
  error: null,
  login: async () => { throw new Error('useRiderAuth: Provider not initialized'); },
  register: async () => { throw new Error('useRiderAuth: Provider not initialized'); },
  verifyPhoneOTP: async () => { throw new Error('useRiderAuth: Provider not initialized'); },
  logout: async () => {},
  updateProfile: () => {},
  refreshRider: async () => {},
  isAuthenticated: false,
};

const RiderAuthContext = createContext(defaultRiderAuthContext);

export const RiderAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('rider_access_token'));
  const [rider, setRider] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rider_profile'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  // Initialize: if token exists, fetch rider profile
  useEffect(() => {
    let mounted = true;

    const normalizeProfile = (p) => {
      if (!p) return p;
      const copy = { ...p };
      // Normalize boolean-like fields
      if (copy.is_online !== undefined) copy.is_online = Boolean(copy.is_online);
      if (copy.can_go_online !== undefined) copy.can_go_online = Boolean(copy.can_go_online);
      return copy;
    };

    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch profile
        const profile = await riderAuth.getProfile();
        
        if (!mounted) return;
        
        // Profile fetch succeeded, normalize and update state
        const normalized = normalizeProfile(profile);
        setRider(normalized);
        localStorage.setItem('rider_profile', JSON.stringify(normalized));
        setError(null);
      } catch (err) {
        if (!mounted) return;
        
        // Log error but don't clear token immediately
        // Only clear if 401 (Unauthorized)
        console.error('Profile fetch error:', err);
        
        if (err.status === 401) {
          // Token is invalid/expired
          localStorage.removeItem('rider_access_token');
          localStorage.removeItem('rider_profile');
          setToken(null);
          setRider(null);
          delete api.defaults.headers.common['Authorization'];
          setError('Session expired. Please login again.');
        } else {
          // Other errors (network, etc) - keep token but show error
          setError(extractErrorMessage(err, 'Failed to load profile'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, [token]);

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Login and get token
      const response = await riderAuth.login(email, password);
      const token = response.access || response.access_token;

      if (!token) throw new Error('No access token received');

      // Step 2: Set token in localStorage and headers
      localStorage.setItem('rider_access_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Step 3: Fetch profile 
      const profile = await riderAuth.getProfile();
      console.debug('[RiderAuth] login fetched profile:', profile);
      
      // Step 4: Normalize and update state (profile first, then token)
      const normalize = (p) => {
        if (!p) return p;
        const copy = { ...p };
        if (copy.is_online !== undefined) copy.is_online = Boolean(copy.is_online);
        if (copy.can_go_online !== undefined) copy.can_go_online = Boolean(copy.can_go_online);
        return copy;
      };
      const normalized = normalize(profile);
      setRider(normalized);
      localStorage.setItem('rider_profile', JSON.stringify(normalized));
      
      // Step 5: Finally set token (this may trigger useEffect but profile is already set)
      setToken(token);

      return profile;
    } catch (err) {
      const errorMsg = err.error || err.message || 'Login failed';
      setError(errorMsg);
      
      // Clear any partial state on error
      localStorage.removeItem('rider_access_token');
      localStorage.removeItem('rider_profile');
      delete api.defaults.headers.common['Authorization'];
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (username, email, password, full_name, phone_number, vehicle_type, vehicle_plate_number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await riderAuth.register(username, email, password, full_name, phone_number, vehicle_type, vehicle_plate_number);
      const token = response.access || response.access_token;

      if (token) {
        localStorage.setItem('rider_access_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setToken(token);
      }

      return response;
    } catch (err) {
      const errorMsg = err.error || err.message || MESSAGES.ERROR.SOMETHING_WRONG;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const verifyPhoneOTP = async (phone_number, otp) => {
    setLoading(true);
    setError(null);

    try {
      const response = await riderAuth.verifyPhoneOTP(phone_number, otp);
      
      if (response.access) {
        localStorage.setItem('rider_access_token', response.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.access}`;
        setToken(response.access);
      }

      return response;
    } catch (err) {
      const errorMsg = err.error || err.message || 'OTP verification failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await riderAuth.logout();
    } finally {
      setToken(null);
      setRider(null);
      setError(null);
      localStorage.removeItem('rider_access_token');
      localStorage.removeItem('rider_profile');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Update rider profile locally
  const updateProfile = (updates) => {
    const updated = { ...rider, ...updates };
    // Ensure booleans are properly typed
    if (updated.is_online !== undefined) updated.is_online = Boolean(updated.is_online);
    if (updated.can_go_online !== undefined) updated.can_go_online = Boolean(updated.can_go_online);
    console.debug('[RiderAuth] updateProfile called. updates:', updates, 'result:', updated);
    setRider(updated);
    localStorage.setItem('rider_profile', JSON.stringify(updated));
  };

  // Refresh rider profile from server
  const refreshRider = async () => {
    if (!token) return null;
    try {
      const profile = await riderAuth.getProfile();
      const normalize = (p) => {
        if (!p) return p;
        const copy = { ...p };
        if (copy.is_online !== undefined) copy.is_online = Boolean(copy.is_online);
        if (copy.can_go_online !== undefined) copy.can_go_online = Boolean(copy.can_go_online);
        return copy;
      };
      const normalized = normalize(profile);
      setRider(normalized);
      localStorage.setItem('rider_profile', JSON.stringify(normalized));
      return normalized;
    } catch (err) {
      console.error('[RiderAuth] refreshRider error:', err);
      throw err;
    }
  };

  return (
    <RiderAuthContext.Provider
      value={{
        token,
        rider,
        loading,
        error,
        login,
        register,
        verifyPhoneOTP,
        logout,
        updateProfile,
        refreshRider,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </RiderAuthContext.Provider>
  );
};

export const useRiderAuth = () => {
  // Return the context (will be the default if provider is missing)
  return useContext(RiderAuthContext);
};
