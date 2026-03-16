/**
 * Formatters Utility
 * Centralized formatting functions for consistent data display
 */

/**
 * Format currency (Naira)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "₦1,500")
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₦0';
  }
  const num = Number(amount);
  return `₦${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone (e.g., "+234 (703) 123-4567")
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Nigerian numbers
  if (cleaned.length === 10) {
    // Local format: 703 123 4567
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 11) {
    // With 0: 0703 123 4567
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 13) {
    // Full international: +234703 123 4567
    return '+' + cleaned.replace(/(\d{3})(\d{3})(\d{7})/, '$1 $2 $3');
  }
  
  return phone; // Return original if can't format
};

/**
 * Format email for display
 * @param {string} email - Email to format
 * @returns {string} Formatted email
 */
export const formatEmail = (email) => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

/**
 * Format date/time
 * @param {string|Date} dateString - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time'
 * @returns {string} Formatted date
 */
export const formatDate = (dateString, format = 'short') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };
  
  return date.toLocaleDateString('en-NG', options[format] || options.short);
};

/**
 * Format distance
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance (e.g., "5.5 km")
 */
export const formatDistance = (km) => {
  if (!km && km !== 0) return '—';
  const num = Number(km);
  return `${num.toFixed(1)} km`;
};

/**
 * Format time duration
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted time (e.g., "25 mins", "1h 10m")
 */
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '—';
  
  const mins = Number(minutes);
  if (mins < 60) {
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
};

/**
 * Format percentage
 * @param {number} percent - Percentage value (0-100)
 * @returns {string} Formatted percentage (e.g., "75%")
 */
export const formatPercent = (percent) => {
  if (percent === null || percent === undefined) return '0%';
  return `${Math.round(Number(percent))}%`;
};

/**
 * Format rating (stars)
 * @param {number} rating - Rating value
 * @param {number} maxStars - Maximum stars (default: 5)
 * @returns {string} Star representation (e.g., "⭐⭐⭐⭐⭐")
 */
export const formatRating = (rating, maxStars = 5) => {
  if (!rating && rating !== 0) return '—';
  
  const num = Number(rating);
  const fullStars = Math.floor(num);
  const hasHalfStar = num % 1 >= 0.5;
  
  let stars = '⭐'.repeat(fullStars);
  if (hasHalfStar && fullStars < maxStars) {
    stars += '⭐'; // Simplified: just add full star
  }
  stars += '☆'.repeat(Math.max(0, maxStars - fullStars - (hasHalfStar ? 1 : 0)));
  
  return `${stars} (${num.toFixed(1)})`;
};

/**
 * Format text to title case
 * @param {string} text - Text to format
 * @returns {string} Title case text
 */
export const formatTitleCase = (text) => {
  if (!text) return '';
  return text
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Truncate long text
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Format array to readable string
 * @param {array} arr - Array to format
 * @param {string} separator - Separator (default: ", ")
 * @returns {string} Formatted string
 */
export const formatList = (arr, separator = ', ') => {
  if (!Array.isArray(arr)) return '';
  if (arr.length === 0) return '';
  if (arr.length === 1) return String(arr[0]);
  
  const last = arr[arr.length - 1];
  const rest = arr.slice(0, -1);
  return `${rest.join(separator)} and ${last}`;
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

export default {
  formatCurrency,
  formatPhoneNumber,
  formatEmail,
  formatDate,
  formatDistance,
  formatDuration,
  formatPercent,
  formatRating,
  formatTitleCase,
  truncateText,
  formatList,
  formatFileSize,
};
