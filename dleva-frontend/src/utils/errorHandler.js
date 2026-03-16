/**
 * Error Handler Utility
 * Centralized error handling for consistent error management across the application
 */

import { MESSAGES } from '../constants/messages';

/**
 * Error types
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Parse error from API response or exception
 * Standardizes error format from different sources
 * 
 * @param {Error|Response|object} error - Error from API, network, or manual throw
 * @returns {object} Standardized error object
 */
export const parseError = (error) => {
  // If already a parsed error object
  if (error?.code && error?.message) {
    return error;
  }
  
  // Network error
  if (!error) {
    return {
      code: ERROR_TYPES.NETWORK,
      message: MESSAGES.ERROR.NETWORK_ERROR,
      status: 0,
      details: null,
    };
  }
  
  // Fetch/Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ERROR_TYPES.NETWORK,
      message: MESSAGES.ERROR.NETWORK_ERROR,
      status: 0,
      details: error.message,
    };
  }
  
  // HTTP Response object
  if (error?.status) {
    const status = error.status;
    
    let code = ERROR_TYPES.SERVER;
    let message = MESSAGES.ERROR.SOMETHING_WRONG;
    
    if (status === 400) {
      code = ERROR_TYPES.VALIDATION;
      message = MESSAGES.ERROR.BAD_REQUEST;
    } else if (status === 401) {
      code = ERROR_TYPES.AUTH;
      message = MESSAGES.ERROR.UNAUTHORIZED;
    } else if (status === 403) {
      code = ERROR_TYPES.PERMISSION;
      message = MESSAGES.ERROR.FORBIDDEN;
    } else if (status === 404) {
      code = ERROR_TYPES.NOT_FOUND;
      message = MESSAGES.ERROR.NOT_FOUND;
    } else if (status === 409) {
      code = ERROR_TYPES.CONFLICT;
      message = error.message || MESSAGES.ERROR.CONFLICT;
    } else if (status === 408 || status === 504) {
      code = ERROR_TYPES.TIMEOUT;
      message = MESSAGES.ERROR.TIMEOUT;
    } else if (status >= 500) {
      code = ERROR_TYPES.SERVER;
      message = MESSAGES.ERROR.SERVER_ERROR;
    }
    
    return {
      code,
      message: error.message || message,
      status,
      details: error.details || error.data || null,
    };
  }
  
  // Standard Error object
  if (error instanceof Error) {
    return {
      code: ERROR_TYPES.UNKNOWN,
      message: error.message || MESSAGES.ERROR.SOMETHING_WRONG,
      status: null,
      details: error.stack,
    };
  }
  
  // Object with error property
  if (error?.error) {
    return parseError(error.error);
  }
  
  // Object with message property
  if (error?.message) {
    return {
      code: ERROR_TYPES.UNKNOWN,
      message: error.message,
      status: error.status || null,
      details: error.details || null,
    };
  }
  
  // Fallback for unknown error types
  return {
    code: ERROR_TYPES.UNKNOWN,
    message: MESSAGES.ERROR.SOMETHING_WRONG,
    status: null,
    details: String(error),
  };
};

/**
 * Handle API error response
 * Extracts error message from API response body
 * 
 * @param {Response} response - Fetch API response object
 * @returns {Promise<object>} Parsed error object
 */
export const handleAPIError = async (response) => {
  try {
    const data = await response.json();
    
    return {
      code:
        response.status === 422 || response.status === 400
          ? ERROR_TYPES.VALIDATION
          : ERROR_TYPES.SERVER,
      message: data.message || data.error || data.detail || MESSAGES.ERROR.SOMETHING_WRONG,
      status: response.status,
      details: data,
    };
  } catch {
    return {
      code: ERROR_TYPES.SERVER,
      message: `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      details: null,
    };
  }
};

/**
 * Format error message for display
 * Removes technical details, uses user-friendly language
 * 
 * @param {Error|object} error - Error to format
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  const parsed = parseError(error);
  
  // If we have a user-friendly message, use it
  if (parsed.message && !parsed.message.includes('undefined')) {
    return parsed.message;
  }
  
  // Fallback based on error type
  const fallbacks = {
    [ERROR_TYPES.NETWORK]: MESSAGES.ERROR.NETWORK_ERROR,
    [ERROR_TYPES.VALIDATION]: MESSAGES.ERROR.MISSING_FIELD,
    [ERROR_TYPES.AUTH]: MESSAGES.ERROR.INVALID_CREDENTIALS,
    [ERROR_TYPES.NOT_FOUND]: MESSAGES.ERROR.NOT_FOUND,
    [ERROR_TYPES.SERVER]: MESSAGES.ERROR.SERVER_ERROR,
    [ERROR_TYPES.PERMISSION]: MESSAGES.ERROR.UNAUTHORIZED,
    [ERROR_TYPES.CONFLICT]: MESSAGES.ERROR.CONFLICT,
    [ERROR_TYPES.TIMEOUT]: MESSAGES.ERROR.TIMEOUT,
  };
  
  return fallbacks[parsed.code] || MESSAGES.ERROR.SOMETHING_WRONG;
};

/**
 * Log error (for debugging)
 * Can be connected to error tracking service (Sentry, etc.)
 * 
 * @param {Error|object} error - Error to log
 * @param {object} context - Additional context information
 */
export const logError = (error, context = {}) => {
  const parsed = parseError(error);
  
  const errorLog = {
    timestamp: new Date().toISOString(),
    code: parsed.code,
    message: parsed.message,
    status: parsed.status,
    details: parsed.details,
    context,
    userAgent: navigator?.userAgent,
    url: window?.location?.href,
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR LOG]', errorLog);
  }
  
  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // sentryService.captureException(errorLog);
};

/**
 * Create custom error
 * 
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {number} status - HTTP status
 * @param {object} details - Additional details
 * @returns {object} Error object
 */
export const createError = (code, message, status = null, details = null) => {
  return {
    code: code || ERROR_TYPES.UNKNOWN,
    message: message || MESSAGES.ERROR.SOMETHING_WRONG,
    status,
    details,
  };
};

/**
 * Retry operation with exponential backoff
 * 
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 1000)
 * @returns {Promise} Result of the operation
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, ...
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Validate error response format
 * Ensures error has required fields
 * 
 * @param {object} error - Error object to validate
 * @returns {boolean} True if valid error object
 */
export const isValidError = (error) => {
  return (
    error &&
    typeof error === 'object' &&
    error.code &&
    error.message
  );
};

/**
 * Handle form validation errors
 * Converts API validation errors to form field errors
 * 
 * @param {object} validationError - Validation error from API
 * @returns {object} Form field errors { fieldName: errorMessage }
 */
export const handleValidationErrors = (validationError) => {
  const errors = {};
  
  if (!validationError || !validationError.details) {
    return errors;
  }
  
  const details = validationError.details;
  
  // Handle different API error formats
  if (Array.isArray(details)) {
    // Nested format: [{ field: 'email', message: 'Invalid' }]
    details.forEach(err => {
      if (err.field) {
        errors[err.field] = err.message;
      }
    });
  } else if (typeof details === 'object') {
    // Direct format: { email: 'Invalid', phone: 'Required' }
    Object.entries(details).forEach(([field, message]) => {
      errors[field] = Array.isArray(message) ? message[0] : message;
    });
  }
  
  return errors;
};

export default {
  ERROR_TYPES,
  parseError,
  handleAPIError,
  getErrorMessage,
  logError,
  createError,
  retryWithBackoff,
  isValidError,
  handleValidationErrors,
};
