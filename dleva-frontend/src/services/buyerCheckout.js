import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerCheckout = {
  // ✅ SECURE FLOW: Validate checkout (no order creation)
  validateCheckout: async (vendorId, paymentMethod, deliveryFee, address, cartItems = [], deliveryLatitude = null, deliveryLongitude = null) => {
    try {
      // ✅ ONLY validate, don't create order
      const response = await api.post(API_ENDPOINTS.BUYER.CHECKOUT, {
        restaurant_id: vendorId,
        payment_method: paymentMethod,
        delivery_fee: deliveryFee,
        delivery_address: address,
        cartItems: cartItems,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
      });
      return response.data; // Returns validation data, not order
    } catch (error) {
      logError(error, { context: 'buyerCheckout.validateCheckout', vendorId });
      throw error.response?.data || { error: 'Failed to validate checkout' };
    }
  },

  // ✅ SECURE FLOW: Initialize payment WITHOUT creating order
  initializePayment: async (amount) => {
    try {
      // ✅ Send amount directly, no order_id needed
      const response = await api.post(API_ENDPOINTS.PAYMENT.INITIALIZE, {
        amount: amount,
      });
      return response.data.data;
    } catch (error) {
      logError(error, { context: 'buyerCheckout.initializePayment', amount });
      throw error.response?.data || { error: 'Failed to initialize payment' };
    }
  },

  // ✅ SECURE FLOW: Complete payment and create order (called from callback)
  completePayment: async (checkoutData, paymentReference) => {
    try {
      // ✅ Convert 'items' to 'cartItems' for backend compatibility
      const payload = {
        reference: paymentReference,
        ...checkoutData,
        cartItems: checkoutData.items || [],  // ✅ FIX: Backend expects 'cartItems'
      };
      
      // Remove the 'items' field if it exists
      delete payload.items;
      
      console.log('📤 Sending to backend:', payload);
      
      const response = await api.post(API_ENDPOINTS.PAYMENT.COMPLETE, payload);
      return response.data.data;
    } catch (error) {
      logError(error, { context: 'buyerCheckout.completePayment', reference: paymentReference });
      throw error.response?.data || { error: 'Failed to complete payment' };
    }
  },

  // Verify payment (legacy - kept for backward compatibility)
  verifyPayment: async (orderId, paystackReference) => {
    try {
      const response = await api.post(API_ENDPOINTS.PAYMENT.VERIFY(orderId), {
        reference: paystackReference,
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCheckout.verifyPayment', orderId });
      throw error.response?.data || { error: 'Payment verification failed' };
    }
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ORDER_DETAIL(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCheckout.getOrderDetails', orderId });
      throw error.response?.data || { error: 'Failed to fetch order details' };
    }
  },

  // List orders
  listOrders: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BUYER.ORDERS);
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerCheckout.listOrders' });
      throw error.response?.data || { error: 'Failed to fetch orders' };
    }
  },
};

export default buyerCheckout;