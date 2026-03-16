import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { getErrorMessage, logError } from '../utils/errorHandler';

const buyerAuth = {
  // Register new buyer
  register: async (data) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.BUYER_REGISTER, {
        username: data.email,
        email: data.email,
        password: data.password,
        first_name: data.name?.split(' ')[0] || '',
        last_name: data.name?.split(' ').slice(1).join(' ') || '',
        phone: data.phone || '',
      });
      
      // Store tokens
      if (response.data.access) {
        localStorage.setItem('buyer_access_token', response.data.access);
        localStorage.setItem('buyer_refresh_token', response.data.refresh);
      }
      
      // Store user data
      localStorage.setItem('dleva_user', JSON.stringify({
        id: response.data.user?.id,
        username: response.data.user?.username,
        email: response.data.user?.email,
        name: response.data.user?.first_name || response.data.user?.username,
        phone: data.phone || '',
        address: '',
        latitude: null,
        longitude: null,
      }));
      
      return response.data;
    } catch (error) {
      const parsedError = error.response?.data || { error: 'Registration failed' };
      logError(error, { context: 'buyerAuth.register' });
      throw parsedError;
    }
  },

  // Login buyer
  login: async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.BUYER_LOGIN, {
        username: credentials.email,
        password: credentials.password,
      });

      const accessToken = response.data.access || response.data.access_token;
      const refreshToken = response.data.refresh || response.data.refresh_token;

      if (accessToken) {
        localStorage.setItem('buyer_access_token', accessToken);
        localStorage.setItem('buyer_refresh_token', refreshToken);

        // remove guest state so app treats user as logged in
        localStorage.removeItem('guest_location');
        localStorage.removeItem('dleva_cart');

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      } else {
        throw new Error('No token received from server');
      }

      const userData = {
        id: response.data.user?.id,
        username: response.data.user?.username || credentials.email,
        email: response.data.user?.email || credentials.email,
        name: response.data.user?.first_name || response.data.user?.username || credentials.email,
        phone: response.data.user?.phone || '',
        address: response.data.user?.address || '',
        latitude: response.data.user?.latitude,
        longitude: response.data.user?.longitude,
        image: response.data.user?.image || null,
      };

      localStorage.setItem('dleva_user', JSON.stringify(userData));
      return response.data;
    } catch (error) {
      const parsedError = error.response?.data || { error: 'Login failed' };
      logError(error, { context: 'buyerAuth.login' });
      throw parsedError;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.PROFILE);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerAuth.getProfile' });
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  // Logout buyer
  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.BUYER.LOGOUT);
    } catch (error) {
      logError(error, { context: 'buyerAuth.logout' });
    } finally {
      // Always clear tokens and user data
      localStorage.removeItem('buyer_access_token');
      localStorage.removeItem('buyer_refresh_token');
      localStorage.removeItem('dleva_user');
      localStorage.removeItem('cart');
      window.location.href = '/';
      return { message: 'Logged out successfully' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('buyer_access_token');
  },

  // Get stored user
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('dleva_user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },
};

export default buyerAuth;