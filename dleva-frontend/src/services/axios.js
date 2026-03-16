import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  // do NOT set Content-Type here; let axios set it per-request
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => { 
  // List of public endpoints that don't need authentication
  const publicEndpoints = ['/seller/register/', '/seller/login/', '/buyer/register/', '/buyer/login/', '/rider/register/', '/rider/login/'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  // Only add auth header for non-public endpoints
  if (!isPublicEndpoint) {
    // Get appropriate token based on request type
    let token;
    if (config.url?.includes('/seller/')) {
      token = localStorage.getItem('seller_access_token');
    } else if (config.url?.includes('/rider/')) {
      token = localStorage.getItem('rider_access_token');
    } else {
      token = localStorage.getItem('buyer_access_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // If payload is FormData, remove any preset Content-Type so boundary is set correctly
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // List of public endpoints that don't need token refresh
    const publicEndpoints = ['/seller/register/', '/seller/login/', '/buyer/register/', '/buyer/login/', '/rider/register/', '/rider/login/'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    
    const isSellerRequest = originalRequest.url?.includes('/seller/');

    // If 401 and not already retried and not a public endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;

      try {
        const isRiderRequest = originalRequest.url?.includes('/rider/');
        let refreshToken;
        if (isSellerRequest) {
          refreshToken = localStorage.getItem('seller_refresh_token');
        } else if (isRiderRequest) {
          refreshToken = localStorage.getItem('rider_refresh_token');
        } else {
          refreshToken = localStorage.getItem('buyer_refresh_token');
        }

        if (refreshToken) {
          // Try to refresh the token
          let endpoint;
          if (isSellerRequest) {
            endpoint = API_ENDPOINTS.AUTH.SELLER_REFRESH_TOKEN;
          } else if (isRiderRequest) {
            endpoint = API_ENDPOINTS.AUTH.RIDER_REFRESH_TOKEN;
          } else {
            endpoint = API_ENDPOINTS.AUTH.BUYER_REFRESH_TOKEN;
          }
          
          const response = await axios.post(
            `${API_BASE_URL}${endpoint}`,
            { refresh: refreshToken }
          );

          const newAccessToken = response.data.access;

          if (isSellerRequest) {
            localStorage.setItem('seller_access_token', newAccessToken);
          } else if (isRiderRequest) {
            localStorage.setItem('rider_access_token', newAccessToken);
          } else {
            localStorage.setItem('buyer_access_token', newAccessToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to appropriate login
        const isRiderRequest = originalRequest.url?.includes('/rider/');
        if (isSellerRequest) {
          localStorage.removeItem('seller_access_token');
          localStorage.removeItem('seller_refresh_token');
          window.location.href = '/seller/login';
        } else if (isRiderRequest) {
          localStorage.removeItem('rider_access_token');
          localStorage.removeItem('rider_refresh_token');
          window.location.href = '/rider/login';
        } else {
          localStorage.removeItem('buyer_access_token');
          localStorage.removeItem('buyer_refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
