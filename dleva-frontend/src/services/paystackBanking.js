import api from './axios';
import { API_ENDPOINTS } from '../constants/apiConfig';

const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (error?.error) return error.error;

  if (!error?.response?.data) return error?.message || defaultMsg;

  const data = error.response.data;

  if (typeof data === 'object' && !data.error && !data.message) {
    const errorEntries = Object.entries(data);
    if (errorEntries.length > 0) {
      const [field, messages] = errorEntries[0];
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
      return `${field}: ${JSON.stringify(messages)}`;
    }
  }

  return data.error || data.message || defaultMsg;
};

const paystackBanking = {
  async listBanks() {
    try {
      const response = await api.get(API_ENDPOINTS.PAYSTACK.BANKS);
      return response.data?.banks || [];
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch banks'),
        status: error.response?.status || error.status,
      };
    }
  },

  async resolveAccount(bankCode, accountNumber) {
    try {
      if (!bankCode || !accountNumber) {
        throw { error: 'Bank and account number are required', status: 400 };
      }

      const response = await api.post(API_ENDPOINTS.PAYSTACK.RESOLVE_ACCOUNT, {
        bank_code: bankCode,
        account_number: accountNumber,
      });

      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to validate bank account'),
        status: error.response?.status || error.status,
      };
    }
  },
};

export default paystackBanking;
