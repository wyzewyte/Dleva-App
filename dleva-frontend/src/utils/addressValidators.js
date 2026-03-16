/**
 * Address Validation Utilities (Frontend)
 * Ensures proper separation of address text from coordinates
 * Mirrors backend validation for consistency
 */

/**
 * Check if an address string looks like coordinates (lat,long format).
 * Prevents storing GPS coordinates as address text.
 *
 * Examples that return true:
 * - "6.5244, 3.3792"
 * - "6.5244,3.3792"
 * - "-23.1234, 45.6789"
 *
 * Examples that return false:
 * - "123 Main Street, City, State"
 * - "no 7, igun road, ekpoma, edo state"
 *
 * @param {string} address - Address string to check
 * @returns {boolean} True if looks like coordinates
 */
export function isCoordinateString(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Pattern: optional minus, 1-2 digits, dot, 4+ decimal digits, comma, same pattern
  const coordinatePattern = /^\s*-?\d{1,2}\.\d{4,},\s*-?\d{1,3}\.\d{4,}\s*$/;
  return coordinatePattern.test(address.trim());
}

/**
 * Validate that address contains actual text and coordinates are in proper fields.
 *
 * @param {string} address - Address text
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {{
 *   valid: boolean,
 *   errors: string[],
 *   warnings: string[]
 * }}
 * @throws {Error} If validation fails
 */
export function validateAddressCoordinateSeparation(address, latitude, longitude) {
  const errors = [];
  const warnings = [];

  // Check if address is coordinate-like
  if (address && isCoordinateString(address)) {
    errors.push(
      `Address appears to contain coordinates instead of street address. ` +
      `Address: '${address}'. Please provide a full street address.`
    );
  }

  // Check if address is missing but coordinates exist
  if (!address || !String(address).trim()) {
    if (latitude && longitude) {
      errors.push(
        `Address is required. Cannot use coordinates (${latitude}, ${longitude}) ` +
        `as address. Please provide a street address.`
      );
    }
  }

  // Validate coordinate ranges
  if (latitude !== null && latitude !== undefined) {
    const latNum = parseFloat(latitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.push(`Latitude ${latitude} is out of valid range (-90 to 90)`);
    }
  }

  if (longitude !== null && longitude !== undefined) {
    const lonNum = parseFloat(longitude);
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      errors.push(`Longitude ${longitude} is out of valid range (-180 to 180)`);
    }
  }

  // Validate both coordinates are present if either is provided
  const hasLatitude = latitude !== null && latitude !== undefined;
  const hasLongitude = longitude !== null && longitude !== undefined;
  if (hasLatitude !== hasLongitude) {
    errors.push('Both latitude and longitude must be provided together, or neither');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join('; '));
    error.validationErrors = errors;
    error.validationWarnings = warnings;
    throw error;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Clean and normalize address string.
 *
 * @param {string} address - Raw address string
 * @returns {string} Sanitized address
 */
export function sanitizeAddress(address) {
  if (!address) {
    return '';
  }

  // Remove extra whitespace
  return address
    .trim()
    .split(/\s+/)
    .join(' ');
}

/**
 * Format coordinates for human-readable display (NOT for storage as address).
 *
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @param {number} precision - Decimal places (default 4)
 * @returns {string} Formatted string like "6.5244, 3.3792"
 */
export function formatCoordinatesForDisplay(latitude, longitude, precision = 4) {
  const latStr = parseFloat(latitude).toFixed(precision);
  const lonStr = parseFloat(longitude).toFixed(precision);
  return `${latStr}, ${lonStr}`;
}

/**
 * Get validation error message to show to user
 *
 * @param {Error} error - Validation error
 * @returns {string} User-friendly error message
 */
export function getAddressValidationErrorMessage(error) {
  if (error.validationErrors?.length > 0) {
    return error.validationErrors[0]; // Show first error to user
  }
  return 'Invalid address or coordinates';
}
