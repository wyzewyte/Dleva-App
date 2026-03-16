/**
 * Rider Delivery Constants
 * Centralized constants for delivery statuses, error messages, and configurations
 */

/**
 * Delivery Status Enum
 * Matches backend delivery status values
 */
export const DELIVERY_STATUSES = {
  ASSIGNED: 'assigned',
  ARRIVED_AT_PICKUP: 'arrived_at_pickup',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  DELIVERY_ATTEMPTED: 'delivery_attempted',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/**
 * Delivery Status Display Names
 * User-friendly labels for each status
 */
export const DELIVERY_STATUS_LABELS = {
  [DELIVERY_STATUSES.ASSIGNED]: 'Order Assigned',
  [DELIVERY_STATUSES.ARRIVED_AT_PICKUP]: 'Arrived at Pickup',
  [DELIVERY_STATUSES.PICKED_UP]: 'Items Picked Up',
  [DELIVERY_STATUSES.ON_THE_WAY]: 'On The Way to Customer',
  [DELIVERY_STATUSES.DELIVERY_ATTEMPTED]: 'Delivery Attempted',
  [DELIVERY_STATUSES.DELIVERED]: 'Delivered Successfully',
  [DELIVERY_STATUSES.CANCELLED]: 'Cancelled',
};

/**
 * Delivery Status Colors (Tailwind classes)
 * For UI status badges and indicators
 */
export const DELIVERY_STATUS_COLORS = {
  [DELIVERY_STATUSES.ASSIGNED]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  [DELIVERY_STATUSES.ARRIVED_AT_PICKUP]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  [DELIVERY_STATUSES.PICKED_UP]: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  [DELIVERY_STATUSES.ON_THE_WAY]: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  [DELIVERY_STATUSES.DELIVERY_ATTEMPTED]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  [DELIVERY_STATUSES.DELIVERED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  [DELIVERY_STATUSES.CANCELLED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

/**
 * Delivery Status Descriptions
 * Detailed descriptions for each status
 */
export const DELIVERY_STATUS_DESCRIPTIONS = {
  [DELIVERY_STATUSES.ASSIGNED]: 'You have been assigned this delivery order',
  [DELIVERY_STATUSES.ARRIVED_AT_PICKUP]: 'You have arrived at the restaurant to pick up the order',
  [DELIVERY_STATUSES.PICKED_UP]: 'You have picked up the order and are heading to the customer',
  [DELIVERY_STATUSES.ON_THE_WAY]: 'You are on the way to deliver the order to the customer',
  [DELIVERY_STATUSES.DELIVERY_ATTEMPTED]: 'You attempted delivery but the customer was unavailable',
  [DELIVERY_STATUSES.DELIVERED]: 'You have successfully delivered the order',
  [DELIVERY_STATUSES.CANCELLED]: 'This delivery has been cancelled',
};

/**
 * Action Permissions by Status
 * Determines which actions are available for each status
 */
export const ACTION_PERMISSIONS = {
  [DELIVERY_STATUSES.ASSIGNED]: ['arrived_at_pickup', 'cancel'],
  [DELIVERY_STATUSES.ARRIVED_AT_PICKUP]: ['pickup', 'cancel'],
  [DELIVERY_STATUSES.PICKED_UP]: ['on_the_way', 'cancel'],
  [DELIVERY_STATUSES.ON_THE_WAY]: ['delivery_attempted', 'complete', 'cancel'],
  [DELIVERY_STATUSES.DELIVERY_ATTEMPTED]: ['delivery_attempted', 'complete', 'cancel'],
  [DELIVERY_STATUSES.DELIVERED]: [],
  [DELIVERY_STATUSES.CANCELLED]: [],
};

/**
 * GPS Tracking Configuration
 */
export const GPS_CONFIG = {
  WATCH_TIMEOUT: 30000, // 30 seconds timeout
  LOCATION_UPDATE_INTERVAL: 15000, // 15 seconds between updates
  ENABLE_HIGH_ACCURACY: true,
  MAX_AGE: 0, // Always get fresh location
  ACCURACY_THRESHOLD: 50, // Warn if accuracy > 50 meters
};

/**
 * WebSocket Configuration
 */
export const WEBSOCKET_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 3000, // Exponential backoff
  MESSAGE_TIMEOUT_MS: 10000,
};

/**
 * Photo Upload Configuration
 */
export const PHOTO_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  QUALITY: 0.8,
};

/**
 * Delivery Attempt Configuration
 */
export const DELIVERY_ATTEMPT_CONFIG = {
  MAX_ATTEMPTS: 3,
  BACKOFF_SECONDS: [60, 300, 900], // 1min, 5min, 15min between attempts
};

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  NOTES_MAX_LENGTH: 200,
  REASON_MAX_LENGTH: 200,
  ITEMS_MIN_VERIFICATION: 1, // At least 1 item must be verified
};

/**
 * Event Types (for WebSocket)
 */
export const WEBSOCKET_EVENTS = {
  STATUS_CHANGED: 'delivery.status_changed',
  LOCATION_UPDATED: 'delivery.location_updated',
  ETA_UPDATED: 'delivery.eta_updated',
  GENERIC: '*',
};

export default {
  DELIVERY_STATUSES,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  DELIVERY_STATUS_DESCRIPTIONS,
  ACTION_PERMISSIONS,
  GPS_CONFIG,
  WEBSOCKET_CONFIG,
  PHOTO_CONFIG,
  DELIVERY_ATTEMPT_CONFIG,
  VALIDATION_RULES,
  WEBSOCKET_EVENTS,
};
