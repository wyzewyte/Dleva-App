/**
 * Rider Wallet Service
 * Handles wallet, earnings, payouts, and performance API calls
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';
import {
  PAYOUT_CONFIG,
  RATING_SCALE,
} from '../constants/walletConstants';

const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (error.error) return error.error;
  if (!error.response?.data) return error.message || defaultMsg;
  const data = error.response.data;
  if (typeof data === 'object' && !data.error && !data.message) {
    const errorEntries = Object.entries(data);
    if (errorEntries.length > 0) {
      const [field, messages] = errorEntries[0];
      if (Array.isArray(messages) && messages.length > 0) return messages[0];
      return `${field}: ${JSON.stringify(messages)}`;
    }
  }
  return data.error || data.message || defaultMsg;
};

const riderWallet = {
  /**
   * Get wallet information (balance, status)
   */
  async getWalletInfo() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.WALLET_INFO);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch wallet info'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get today's earnings
   */
  async getEarningsToday() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.WALLET_EARNINGS_TODAY);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch today earnings'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get weekly earnings breakdown (last 7 days)
   */
  async getEarningsWeekly() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.WALLET_EARNINGS_WEEKLY);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch weekly earnings'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get delivery stats for a selected period.
   */
  async getDeliveryStats({ period = 'day', startDate, endDate } = {}) {
    try {
      const params = { period };

      if (period === 'custom') {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await api.get(API_ENDPOINTS.RIDER.WALLET_DELIVERY_STATS, {
        params,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch delivery stats'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get all-time earnings summary
   */
  async getEarningsSummary() {
    try {
      const response = await api.get(
        API_ENDPOINTS.RIDER.WALLET_EARNINGS_SUMMARY
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch earnings summary'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(pageOrOptions = 1, limit = PAYOUT_CONFIG.PAGINATION_LIMIT) {
    try {
      const options = typeof pageOrOptions === 'object'
        ? pageOrOptions
        : { page: pageOrOptions, limit };
      const page = options.page || 1;
      const pageLimit = options.limit || PAYOUT_CONFIG.PAGINATION_LIMIT;
      const offset = (page - 1) * pageLimit;
      const params = { offset, limit: pageLimit };

      if (options.period) {
        params.period = options.period;
      }

      if (options.period === 'custom') {
        params.start_date = options.startDate;
        params.end_date = options.endDate;
      }

      if (options.type) {
        params.type = options.type;
      }

      const response = await api.get(
        API_ENDPOINTS.RIDER.WALLET_TRANSACTIONS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch transactions'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Request a payout/withdrawal
   * Minimum: ₦2000
   */
  async requestPayout(amount) {
    try {
      if (!amount || amount < PAYOUT_CONFIG.MINIMUM_AMOUNT) {
        throw {
          error: `Minimum payout is ${PAYOUT_CONFIG.CURRENCY}${PAYOUT_CONFIG.MINIMUM_AMOUNT.toLocaleString()}`,
          status: 400,
        };
      }

      const response = await api.post(API_ENDPOINTS.RIDER.PAYOUT_REQUEST, {
        amount: parseFloat(amount),
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to request payout'),
        status: error.response?.status || error.status,
      };
    }
  },

  /**
   * Get payout history
   */
  async getPayoutHistory(pageOrOptions = 1, limit = PAYOUT_CONFIG.PAGINATION_LIMIT) {
    try {
      const options = typeof pageOrOptions === 'object'
        ? pageOrOptions
        : { page: pageOrOptions, limit };
      const params = {
        page: options.page || 1,
        limit: options.limit || PAYOUT_CONFIG.PAGINATION_LIMIT,
      };

      if (options.period) {
        params.period = options.period;
      }

      if (options.period === 'custom') {
        params.start_date = options.startDate;
        params.end_date = options.endDate;
      }

      if (options.status) {
        params.status = options.status;
      }

      const response = await api.get(API_ENDPOINTS.RIDER.PAYOUT_HISTORY, {
        params,
      });
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch payout history'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get rider performance metrics
   */
  async getPerformanceMetrics(riderId) {
    try {
      if (!riderId) throw { error: 'Rider ID is required', status: 400 };

      const response = await api.get(
        API_ENDPOINTS.RIDER.RIDER_PERFORMANCE(riderId)
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch performance metrics'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get rider ratings and reviews
   */
  async getRiderRatings(riderId) {
    try {
      if (!riderId) throw { error: 'Rider ID is required', status: 400 };

      const response = await api.get(
        API_ENDPOINTS.RIDER.RIDER_RATINGS(riderId)
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch ratings'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Submit rider rating (from buyer after delivery)
   */
  async submitRating(orderId, rating, review = '') {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      if (
        !rating ||
        rating < RATING_SCALE.MIN ||
        rating > RATING_SCALE.MAX
      ) {
        throw {
          error: `Rating must be between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}`,
          status: 400,
        };
      }

      const response = await api.post(
        API_ENDPOINTS.RIDER.SUBMIT_RATING(orderId),
        {
          rating: parseInt(rating),
          review: review || '',
        }
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to submit rating'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Lodge a dispute for an order
   */
  async lodgeDispute(orderId, reason, description = '') {
    try {
      if (!orderId) throw { error: 'Order ID is required', status: 400 };
      if (!reason) throw { error: 'Dispute reason is required', status: 400 };

      const response = await api.post(
        API_ENDPOINTS.RIDER.LODGE_DISPUTE(orderId),
        {
          reason,
          description: description || '',
        }
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to lodge dispute'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get dispute status
   */
  async getDisputeStatus(disputeId) {
    try {
      if (!disputeId) throw { error: 'Dispute ID is required', status: 400 };

      const response = await api.get(
        API_ENDPOINTS.RIDER.DISPUTE_STATUS(disputeId)
      );
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch dispute status'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Get my disputes
   */
  async getMyDisputes() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.MY_DISPUTES);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch disputes'),
        status: error.response?.status,
      };
    }
  },
};

export default riderWallet;
