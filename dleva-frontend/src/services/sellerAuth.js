import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerAuth = {
  // Register seller
  register: async (data) => {
    try {
      const payload = {
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
        restaurant_name: data.restaurant_name,
        business_type: data.business_type || 'student_vendor',
        address: data.address || '',
      };
      
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_REGISTER, payload);
      
      if (response.data.access) {
        localStorage.setItem('seller_access_token', response.data.access);
        localStorage.setItem('seller_refresh_token', response.data.refresh);
      }
      
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { error: 'Registration failed' };
      logError(error, { context: 'sellerAuth.register', payload: data });
      throw errorData;
    }
  },

  // Login seller
  login: async (username, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SELLER_LOGIN, {
        username,
        password,
      });
      
      if (response.data.access) {
        localStorage.setItem('seller_access_token', response.data.access);
        localStorage.setItem('seller_refresh_token', response.data.refresh);
      }
      
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerAuth.login', username });
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Logout seller
  logout: async () => {
    try {
      localStorage.removeItem('seller_access_token');
      localStorage.removeItem('seller_refresh_token');
      localStorage.removeItem('seller_profile');
      return { message: 'Logged out successfully' };
    } catch (error) {
      logError(error, { context: 'sellerAuth.logout' });
      return { message: 'Logged out' };
    }
  },
};

export default sellerAuth;