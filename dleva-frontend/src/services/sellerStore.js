import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const sellerStore = {
  // Get store status
  getStoreStatus: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SELLER.RESTAURANT_GET);
      return {
        is_active: response.data.is_active,
        name: response.data.name,
      };
    } catch (error) {
      logError(error, { context: 'sellerStore.getStoreStatus' });
      throw error.response?.data || { error: 'Failed to fetch store status' };
    }
  },

  // Update store status
  updateStoreStatus: async (is_active) => {
    try {
      const response = await api.patch(API_ENDPOINTS.SELLER.RESTAURANT_UPDATE, { is_active });
      return response.data;
    } catch (error) {
      logError(error, { context: 'sellerStore.updateStoreStatus', is_active });
      throw error.response?.data || { error: 'Failed to update store status' };
    }
  },
};

export default sellerStore;