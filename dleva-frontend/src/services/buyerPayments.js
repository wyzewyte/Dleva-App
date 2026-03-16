import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';
import { logError } from '../utils/errorHandler';

const buyerPayments = {
  // Initialize payment (Paystack)
  initializePayment: async (orderId) => {
    try {
      const response = await api.post(API_ENDPOINTS.PAYMENT.INITIALIZE(orderId), {
        provider: 'paystack',
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerPayments.initializePayment', orderId });
      throw error.response?.data || { error: 'Failed to initialize payment' };
    }
  },

  // Verify payment
  verifyPayment: async (reference, verified = true) => {
    try {
      const response = await api.post(API_ENDPOINTS.PAYMENT.VERIFY(reference), {
        verified: verified,
        provider: 'paystack',
      });
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerPayments.verifyPayment', reference });
      throw error.response?.data || { error: 'Payment verification failed' };
    }
  },

  // Get payment status
  getPaymentStatus: async (orderId) => {
    try {
      const response = await api.get(API_ENDPOINTS.PAYMENT.STATUS(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerPayments.getPaymentStatus', orderId });
      throw error.response?.data || { error: 'Failed to fetch payment status' };
    }
  },

  // Cancel payment
  cancelPayment: async (orderId) => {
    try {
      const response = await api.post(API_ENDPOINTS.PAYMENT.CANCEL(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerPayments.cancelPayment', orderId });
      throw error.response?.data || { error: 'Failed to cancel payment' };
    }
  },

  // Get payment history
  getPaymentHistory: async (orderId) => {
    try {
      const response = await api.get(API_ENDPOINTS.PAYMENT.HISTORY(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerPayments.getPaymentHistory', orderId });
      throw error.response?.data || { error: 'Failed to fetch payment history' };
    }
  },

  // Retry payment
  retryPayment: async (orderId) => {
    try {
      const response = await api.post(API_ENDPOINTS.PAYMENT.RETRY(orderId));
      return response.data;
    } catch (error) {
      logError(error, { context: 'buyerPayments.retryPayment', orderId });
      throw error.response?.data || { error: 'Failed to retry payment' };
    }
  },
};

export default buyerPayments;