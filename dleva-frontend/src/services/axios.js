import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // Enable sending cookies with requests (required for session-based OTP)
  // do NOT set Content-Type here; let axios set it per-request
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => { 
  // List of public endpoints that don't need authentication
  const publicEndpoints = [
    '/seller/register/', '/seller/login/', 
    '/seller/request-phone-otp/', '/seller/verify-phone-otp/',
    '/seller/request-email-otp/', '/seller/verify-email-otp/',
    '/buyer/register/', '/buyer/login/',
    '/buyer/request-phone-otp/', '/buyer/verify-phone-otp/',
    '/buyer/request-email-otp/', '/buyer/verify-email-otp/',
    '/buyer/address/search/', '/buyer/address/reverse-geocode/',
    '/rider/register/', '/rider/login/', 
    '/rider/request-phone-otp/', '/rider/verify-phone-otp/',
    '/rider/request-email-otp/', '/rider/verify-email-otp/',
    '/paystack/banks/', '/paystack/resolve-account/',
    // Password reset endpoints (public)
    '/rider/forgot-password/', '/rider/verify-reset-code/', '/rider/reset-password/',
    '/buyer/forgot-password/', '/buyer/verify-reset-code/', '/buyer/reset-password/',
    '/seller/forgot-password/', '/seller/verify-reset-code/', '/seller/reset-password/',
  ];
  const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  // Only add auth header for non-public endpoints
  if (!isPublicEndpoint) {
    // Allow callers to explicitly choose which authenticated app token to use.
    const explicitAuthRole = config.authRole;

    // Get appropriate token based on request type
    let token;
    if (explicitAuthRole === 'seller') {
      token = localStorage.getItem('seller_access_token');
    } else if (explicitAuthRole === 'rider') {
      token = localStorage.getItem('rider_access_token');
    } else if (explicitAuthRole === 'buyer') {
      token = localStorage.getItem('buyer_access_token');
    } else if (config.url?.includes('/seller/')) {
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
    const publicEndpoints = [
      '/seller/register/', '/seller/login/',
      '/seller/request-phone-otp/', '/seller/verify-phone-otp/',
      '/seller/request-email-otp/', '/seller/verify-email-otp/',
      '/buyer/register/', '/buyer/login/',
      '/buyer/request-phone-otp/', '/buyer/verify-phone-otp/',
      '/buyer/request-email-otp/', '/buyer/verify-email-otp/',
      '/buyer/address/search/', '/buyer/address/reverse-geocode/',
      '/rider/register/', '/rider/login/',
      '/rider/request-phone-otp/', '/rider/verify-phone-otp/',
      '/rider/request-email-otp/', '/rider/verify-email-otp/',
      '/paystack/banks/', '/paystack/resolve-account/'
    ];
    const isPublicEndpoint = publicEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    
    const explicitAuthRole = originalRequest.authRole;
    const isSellerRequest = explicitAuthRole === 'seller' || originalRequest.url?.includes('/seller/');

    // If 401 and not already retried and not a public endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;

      try {
        const isRiderRequest = explicitAuthRole === 'rider' || (explicitAuthRole !== 'buyer' && originalRequest.url?.includes('/rider/'));
        let refreshToken;
        if (explicitAuthRole === 'buyer') {
          refreshToken = localStorage.getItem('buyer_refresh_token');
        } else if (isSellerRequest) {
          refreshToken = localStorage.getItem('seller_refresh_token');
        } else if (isRiderRequest) {
          refreshToken = localStorage.getItem('rider_refresh_token');
        } else {
          refreshToken = localStorage.getItem('buyer_refresh_token');
        }

        if (refreshToken) {
          // Try to refresh the token
          let endpoint;
          if (explicitAuthRole === 'buyer') {
            endpoint = API_ENDPOINTS.AUTH.BUYER_REFRESH_TOKEN;
          } else if (isSellerRequest) {
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

          if (explicitAuthRole === 'buyer') {
            localStorage.setItem('buyer_access_token', newAccessToken);
          } else if (isSellerRequest) {
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
        const isRiderRequest = explicitAuthRole === 'rider' || (explicitAuthRole !== 'buyer' && originalRequest.url?.includes('/rider/'));
        if (explicitAuthRole === 'buyer') {
          localStorage.removeItem('buyer_access_token');
          localStorage.removeItem('buyer_refresh_token');
          window.location.href = '/home';
        } else if (isSellerRequest) {
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
          window.location.href = '/home';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
