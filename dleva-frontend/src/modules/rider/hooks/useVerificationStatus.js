/**
 * useVerificationStatus Hook
 * Fetches detailed verification status from backend
 * Includes: documents, bank details, phone, and overall can_go_online status
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { useRiderAuth } from '../context/RiderAuthContext';

export const useVerificationStatus = () => {
  const { token, loading: authLoading } = useRiderAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVerificationStatus = useCallback(async () => {
    // Guard: Don't fetch if auth is loading or no token
    if (authLoading || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.RIDER.VERIFICATION_STATUS);
      setStatus(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
      setError(err.response?.data?.error || 'Failed to load verification status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [token, authLoading]);

  // Fetch on mount and when token/auth changes
  useEffect(() => {
    if (!authLoading && token) {
      fetchVerificationStatus();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  return {
    status,
    loading,
    error,
    refetch: fetchVerificationStatus,
  };
};

export default useVerificationStatus;
