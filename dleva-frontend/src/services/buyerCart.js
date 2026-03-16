import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerCart = {
  // Get cart items
  getCart: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CART.VIEW);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCart.getCart' });
      throw error.response?.data || { error: 'Failed to fetch cart' };
    }
  },

  // Add item to cart
  addItem: async (vendorId, menuItemId, quantity = 1) => {
    try {
      const body = { vendor_id: vendorId, menu_item_id: menuItemId, quantity };
      const response = await api.post(API_ENDPOINTS.CART.ADD_ITEM, body);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCart.addItem', vendorId, menuItemId });
      throw error.response?.data || { error: 'Failed to add item to cart' };
    }
  },

  // Update cart item quantity
  updateQuantity: async (cartItemId, quantity) => {
    try {
      const response = await api.put(API_ENDPOINTS.CART.UPDATE_ITEM(cartItemId), { quantity });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCart.updateQuantity', cartItemId });
      throw error.response?.data || { error: 'Failed to update cart item' };
    }
  },

  // Remove item from cart
  removeItem: async (cartItemId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.CART.REMOVE_ITEM(cartItemId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCart.removeItem', cartItemId });
      throw error.response?.data || { error: 'Failed to remove item' };
    }
  },

  // Clear entire cart - pass vendorId in URL
  clearCart: async (vendorId) => {
    try {
      const response = await api.post(API_ENDPOINTS.CART.CLEAR(vendorId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCart.clearCart', vendorId });
      throw error.response?.data || { error: 'Failed to clear cart' };
    }
  },

  // Save cart to localStorage (offline support)
  saveLocalCart: (cartData) => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartData));
    } catch (error) {
      logError(error, { context: 'buyerCart.saveLocalCart' });
    }
  },

  // Get cart from localStorage
  getLocalCart: () => {
    try {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : null;
    } catch (error) {
      return null;
    }
  },

  // Clear localStorage cart
  clearLocalCart: () => {
    localStorage.removeItem('cart');
  },
};

export default buyerCart;