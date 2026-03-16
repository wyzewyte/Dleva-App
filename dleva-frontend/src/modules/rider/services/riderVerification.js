/**
 * Rider Verification Service
 * Handles all verification-related API calls (documents, bank details, etc.)
 */

import api from '../../../services/axios';
import { API_ENDPOINTS } from '../../../constants/apiConfig';

/**
 * Extract error message from various backend response formats
 */
const extractErrorMessage = (error, defaultMsg = 'Request failed') => {
  if (error.error) return error.error;
  
  if (!error.response?.data) return error.message || defaultMsg;
  
  const data = error.response.data;
  
  // Handle serializer validation errors (Django DRF dict format)
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

const riderVerification = {
  // Upload identification document
  async uploadDocument(file, documentType) {
    try {
      if (!file || !documentType) {
        throw { error: 'File and document type are required', status: 400 };
      }
      
      const formData = new FormData();
      formData.append('file', file);  // ✅ FIXED: Backend expects 'file', not 'document'
      formData.append('document_type', documentType); // 'id_card', 'driver_license', 'student_id'

      const response = await api.post(API_ENDPOINTS.RIDER.VERIFICATION.UPLOAD_DOCUMENT, formData);

      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Document upload failed'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Add or update bank details
  async addBankDetails(bankData) {
    try {
      if (!bankData.bank_name || !bankData.account_number || !bankData.account_name) {
        throw { error: 'All bank details are required', status: 400 };
      }
      
      const response = await api.post(API_ENDPOINTS.RIDER.VERIFICATION.BANK_DETAILS, {
        bank_name: bankData.bank_name,
        account_number: bankData.account_number,
        account_name: bankData.account_name,
      });

      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to save bank details'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Update bank details (alias for addBankDetails)
  async updateBankDetails(accountNumber, bankCode, accountName) {
    try {
      if (!accountNumber || !bankCode || !accountName) {
        throw { error: 'All bank details are required', status: 400 };
      }
      
      const response = await api.post(API_ENDPOINTS.RIDER.VERIFICATION.BANK_DETAILS, {
        account_number: accountNumber,
        bank_code: bankCode,
        account_name: accountName,
      });

      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Bank details update failed'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Get bank details
  async getBankDetails() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.VERIFICATION.GET_BANK_DETAILS);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch bank details'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Get verification status
  async getVerificationStatus() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.VERIFICATION.STATUS);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch verification status'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Validate file before upload (client-side validation)
  validateFile(file, maxSize, allowedFormats) {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${fileSizeMB}MB`,
      };
    }

    // Check file type
    if (allowedFormats && allowedFormats.length > 0) {
      const fileType = file.type;
      const fileName = file.name;
      const fileExt = fileName.split('.').pop().toLowerCase();

      // Check MIME type
      const isAllowedByType = allowedFormats.some(
        (format) => fileType === format || fileType.startsWith(format.replace(/\/\*$/, ''))
      );

      if (!isAllowedByType) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${allowedFormats.join(', ')}`,
        };
      }
    }

    return { valid: true };
  },

  // Get available service areas
  async getAvailableServiceAreas() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.VERIFICATION.SERVICE_AREAS_AVAILABLE);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch service areas'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Get rider's selected service areas
  async getRiderServiceAreas() {
    try {
      const response = await api.get(API_ENDPOINTS.RIDER.VERIFICATION.SERVICE_AREAS_GET);
      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to fetch your service areas'),
        status: error.response?.status || error.status,
      };
    }
  },

  // Set/update rider's service areas
  async setServiceAreas(serviceAreas) {
    try {
      if (!serviceAreas || serviceAreas.length === 0) {
        throw { error: 'At least one service area must be selected', status: 400 };
      }

      const response = await api.post(API_ENDPOINTS.RIDER.VERIFICATION.SERVICE_AREAS_SET, {
        service_areas: serviceAreas, // Array of area codes
      });

      return response.data;
    } catch (error) {
      throw {
        error: extractErrorMessage(error, 'Failed to save service areas'),
        status: error.response?.status || error.status,
      };
    }
  },
};
export default riderVerification;