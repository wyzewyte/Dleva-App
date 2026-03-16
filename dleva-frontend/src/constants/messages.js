/**
 * Messages Constants
 * Centralized user-facing messages for consistency
 */

export const MESSAGES = {
  // Success messages
  SUCCESS: {
    ITEM_ADDED: 'Item added to cart',
    ITEM_REMOVED: 'Item removed from cart',
    ORDER_PLACED: 'Order placed successfully',
    ORDER_CONFIRMED: 'Order confirmed',
    STATUS_UPDATED: 'Status updated successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    LOGGED_IN: 'Logged in successfully',
    LOGGED_OUT: 'Logged out successfully',
    REGISTERED: 'Registration successful',
    PAYMENT_SUCCESS: 'Payment successful',
    PAYMENT_CONFIRMED: 'Payment confirmed',
    WITHDRAWAL_REQUESTED: 'Withdrawal requested successfully',
    DISPUTE_LODGED: 'Dispute lodged successfully',
    RATING_SUBMITTED: 'Rating submitted successfully',
    LOCATION_UPDATED: 'Location updated',
    DOCUMENT_UPLOADED: 'Document uploaded successfully',
    BANK_DETAILS_SAVED: 'Bank details saved successfully',
  },

  // Error messages
  ERROR: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SOMETHING_WRONG: 'Something went wrong. Please try again.',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already registered',
    PHONE_EXISTS: 'Phone number already registered',
    WEAK_PASSWORD: 'Password is too weak',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    MISSING_FIELD: 'Please fill in all required fields',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PHONE: 'Invalid phone number format',
    INVALID_AMOUNT: 'Invalid amount',
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    ORDER_NOT_FOUND: 'Order not found',
    CANNOT_CANCEL: 'This order cannot be cancelled',
    LOCATION_REQUIRED: 'Location is required',
    ADDRESS_REQUIRED: 'Delivery address is required',
    PAYMENT_FAILED: 'Payment failed. Please try again.',
    FEE_CALCULATION_FAILED: 'Failed to calculate delivery fee',
    NO_RIDERS_AVAILABLE: 'No riders available. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    FORBIDDEN: 'Access denied',
    SERVER_ERROR: 'Server error. Please try again later.',
    NOT_FOUND: 'Page not found',
    BAD_REQUEST: 'Invalid request',
    CONFLICT: 'Resource conflict',
    TIMEOUT: 'Request timeout. Please try again.',
  },

  // Warning messages
  WARNING: {
    UNSAVED_CHANGES: 'You have unsaved changes',
    CONFIRM_DELETE: 'Are you sure you want to delete this?',
    CONFIRM_CANCEL_ORDER: 'Are you sure you want to cancel this order?',
    LOW_BALANCE: 'Your balance is low',
    ORDER_EXPIRING: 'This order is expiring soon',
    DOCUMENT_EXPIRED: 'Your document has expired',
  },

  // Info messages
  INFO: {
    CALCULATING: 'Calculating...',
    LOADING: 'Loading...',
    PROCESSING: 'Processing...',
    SENDING: 'Sending...',
    NO_RESULTS: 'No results found',
    NO_DATA: 'No data available',
    EMPTY_CART: 'Your cart is empty',
    NO_ORDERS: 'No orders found',
    NO_RESTAURANTS: 'No restaurants available',
    SEARCH_HINT: 'Search for restaurants or food',
    LOGIN_REQUIRED: 'Please log in to continue',
    NO_LOCATION_DATA: 'Location data not available',
  },

  // Confirmation messages
  CONFIRM: {
    LOGOUT: 'Are you sure you want to log out?',
    DELETE_ACCOUNT: 'Are you sure you want to delete your account? This action cannot be undone.',
    CLEAR_CART: 'Clear cart and start fresh?',
    PLACE_ORDER: 'Place order for ₦{amount}?',
    CANCEL_ORDER: 'Cancel this order?',
    RATE_ORDER: 'Rate this order?',
  },

  // Status messages
  STATUS: {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    AWAY: 'Away',
    BUSY: 'Busy',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
    VERIFIED: 'Verified',
    UNVERIFIED: 'Unverified',
  },

  // Validation messages
  VALIDATION: {
    REQUIRED: '{field} is required',
    INVALID_FORMAT: 'Invalid {field} format',
    MIN_LENGTH: '{field} must be at least {count} characters',
    MAX_LENGTH: '{field} must not exceed {count} characters',
    MUST_BE_NUMBER: '{field} must be a number',
    MUST_BE_POSITIVE: '{field} must be greater than 0',
    MUST_BE_VALID_EMAIL: 'Please enter a valid email address',
    MUST_BE_VALID_PHONE: 'Please enter a valid phone number',
    MUST_BE_VALID_URL: 'Please enter a valid URL',
    PASSWORDS_MUST_MATCH: 'Passwords must match',
  },

  // Order-related messages
  ORDER: {
    CONFIRMING: 'Seller is confirming your order',
    PREPARING: 'Your order is being prepared',
    READY: 'Your order is ready for pickup',
    RIDER_ASSIGNED: 'Rider has been assigned',
    RIDER_ON_THE_WAY: 'Rider is on the way',
    DELIVERY_ATTEMPTED: 'Delivery was attempted',
    DELIVERED: 'Order delivered successfully',
    CANCELLED: 'Order has been cancelled',
    AWAITING_PAYMENT: 'Awaiting payment confirmation',
  },

  // Rider-related messages
  RIDER: {
    STATUS_UPDATED: 'Status updated',
    LOCATION_UPDATED: 'Location updated',
    EARNINGS_ADDED: 'Earnings added to wallet',
    WITHDRAWAL_PROCESSED: 'Withdrawal processed',
    NO_AVAILABLE_ORDERS: 'No available orders at the moment',
  },

  // Seller-related messages
  SELLER: {
    NEW_ORDER: 'New order received',
    ORDER_CANCELLED: 'Order was cancelled',
    CUSTOMER_ARRIVED: 'Customer has arrived',
    EARNINGS_CREDITED: 'Earnings credited to account',
  },

  // Buyer-related messages
  BUYER: {
    ORDER_CONFIRMED: 'Your order has been confirmed',
    ORDER_READY: 'Your order is ready',
    ORDER_ON_THE_WAY: 'Your order is on the way',
    DELIVERY_FAILED: 'Delivery was unsuccessful',
  },

  // Rider Delivery-specific messages
  RIDER_DELIVERY: {
    ARRIVAL_CONFIRMED: 'Arrival at pickup confirmed',
    PICKUP_CONFIRMED: 'Items picked up successfully',
    ON_THE_WAY: 'You are now on the way to deliver',
    DELIVERY_ATTEMPT_RECORDED: 'Delivery attempt recorded',
    DELIVERY_COMPLETED: 'Delivery completed successfully',
    DELIVERY_CANCELLED: 'Delivery cancelled',
    GPS_TRACKING_STARTED: 'GPS tracking started',
    GPS_TRACKING_STOPPED: 'GPS tracking stopped',
    LOCATION_ACCURACY_LOW: 'Location accuracy is low (±{accuracy}m)',
    GPS_UNAVAILABLE: 'GPS location unavailable',
    WEBSOCKET_CONNECTED: 'Connected to real-time updates',
    WEBSOCKET_RECONNECTING: 'Reconnecting to real-time updates...',
    WEBSOCKET_DISCONNECTED: 'Real-time updates disconnected',
    PHOTO_UPLOAD_FAILED: 'Failed to upload proof photo',
    INVALID_PHOTO_FORMAT: 'Invalid photo format. Use JPG, PNG, or WebP.',
    PHOTO_TOO_LARGE: 'Photo size exceeds 5MB limit',
    INVALID_DELIVERY_PIN: 'Invalid delivery PIN',
    CUSTOMER_NOT_AVAILABLE: 'Customer not available - attempt recorded',
    DELIVERY_ADDRESS_NOT_FOUND: 'Delivery address not found',
  },

  // Delivery status messages
  DELIVERY_STATUS: {
    ASSIGNED: 'Order assigned to you',
    ARRIVED_AT_PICKUP: 'Arrived at restaurant',
    PICKED_UP: 'Items picked up',
    ON_THE_WAY: 'On the way to customer',
    DELIVERY_ATTEMPTED: 'Delivery attempt made',
    DELIVERED: 'Delivered successfully',
    CANCELLED: 'Delivery cancelled',
  },
};

/**
 * Get message with variable substitution
 * @param {string} messagePath - Path to message (e.g., 'SUCCESS.ITEM_ADDED')
 * @param {object} variables - Variables to substitute (e.g., { amount: 1500 })
 * @returns {string} Message with substitutions
 */
export const getMessage = (messagePath, variables = {}) => {
  const keys = messagePath.split('.');
  let message = MESSAGES;
  
  for (const key of keys) {
    message = message[key];
    if (!message) return messagePath; // Return path if not found
  }
  
  // Replace variables in message
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, value);
  });
  
  return message;
};

export default MESSAGES;
