/**
 * Validators Utility
 * Centralized validation functions for consistent data validation
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate phone number (Nigerian format)
 * @param {string} phone - Phone number to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Accept 10 (without 0), 11 (with 0), or 13 (full international) digits
  if (![10, 11, 13].includes(cleaned.length)) {
    return { isValid: false, error: 'Phone number must be 10-13 digits' };
  }
  
  // If starting with 0, ensure it's followed by 7, 8, or 9
  if (cleaned.length === 11 && !['07', '08', '09'].includes(cleaned.substring(0, 2))) {
    return { isValid: false, error: 'Nigerian phone must start with 070-079, 080-089, or 090-099' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, error: string|null, strength: 'weak'|'medium'|'strong' }
 */
export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required', strength: 'weak' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters', strength: 'weak' };
  }
  
  let strength = 'weak';
  let checks = 0;
  
  // Check for uppercase
  if (/[A-Z]/.test(password)) checks++;
  
  // Check for lowercase
  if (/[a-z]/.test(password)) checks++;
  
  // Check for numbers
  if (/[0-9]/.test(password)) checks++;
  
  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) checks++;
  
  if (checks >= 3 || password.length >= 12) {
    strength = 'strong';
  } else if (checks >= 2) {
    strength = 'medium';
  }
  
  return { isValid: true, error: null, strength };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - Field name for error message
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (String(value).length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
  if (!value) {
    return { isValid: true, error: null }; // Optional field
  }
  
  if (String(value).length > maxLength) {
    return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate numeric value
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateNumeric = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (isNaN(Number(value))) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateURL = (url) => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL is required' };
  }
  
  try {
    new URL(url);
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate price/amount
 * @param {any} amount - Amount to validate
 * @param {string} fieldName - Field name for error message
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateAmount = (amount, fieldName = 'Amount') => {
  const numValidation = validateNumeric(amount, fieldName);
  if (!numValidation.isValid) {
    return numValidation;
  }
  
  const num = Number(amount);
  if (num <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than 0` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate address
 * @param {string} address - Address to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateAddress = (address) => {
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Address is required' };
  }
  
  if (address.length < 5) {
    return { isValid: false, error: 'Address must be at least 5 characters' };
  }
  
  if (address.length > 255) {
    return { isValid: false, error: 'Address must not exceed 255 characters' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate latitude/longitude
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateCoordinates = (lat, lon) => {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  
  if (isNaN(latNum) || isNaN(lonNum)) {
    return { isValid: false, error: 'Invalid coordinates' };
  }
  
  if (latNum < -90 || latNum > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }
  
  if (lonNum < -180 || lonNum > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate form object
 * @param {object} data - Form data to validate
 * @param {object} rules - Validation rules { fieldName: [validatorFunction, ...] }
 * @returns {object} { isValid: boolean, errors: { fieldName: string, ... } }
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.entries(rules).forEach(([field, validators]) => {
    if (!Array.isArray(validators)) validators = [validators];
    
    for (const validator of validators) {
      const result = validator(data[field]);
      if (!result.isValid) {
        errors[field] = result.error;
        break; // Stop at first error
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumeric,
  validateURL,
  validateAmount,
  validateAddress,
  validateCoordinates,
  validateForm,
};
