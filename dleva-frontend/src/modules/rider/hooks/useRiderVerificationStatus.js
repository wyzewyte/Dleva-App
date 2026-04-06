/**
 * Rider verification status hook.
 *
 * Kept in a dedicated module so rider screens can share one
 * verification fetch path without coupling to stale hook caches.
 */
import * as React from 'react';
import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { useRiderAuth } from '../context/RiderAuthContext';

const useRiderVerificationStatus = () => {
  const { token, loading: authLoading } = useRiderAuth();
  const [status, setStatus] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  if (typeof window !== 'undefined') {
    console.debug('[useRiderVerificationStatus] hook invoked', {
      reactVersion: React.version,
      sameReactAsBootstrap: window.__DLEVA_REACT__ === React,
      hasToken: Boolean(token),
      authLoading,
    });
  }

  const fetchVerificationStatus = React.useCallback(async () => {
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
  }, [authLoading, token]);

  React.useEffect(() => {
    if (!authLoading && token) {
      fetchVerificationStatus().catch(() => {});
    } else {
      setLoading(false);
    }
  }, [authLoading, fetchVerificationStatus, token]);

  return {
    status,
    loading,
    error,
    refetch: fetchVerificationStatus,
  };
};

export default useRiderVerificationStatus;
