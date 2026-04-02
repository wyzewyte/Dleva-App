/**
 * API Configuration
 * Single source of truth for API endpoints and configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

/**
 * Route Paths
 * Organized by module for easy discovery
 */
export const ROUTES = {
  RIDER: {
    DASHBOARD: '/rider/dashboard',
    EARNINGS: '/rider/earnings',
    SETTINGS: '/rider/settings',
    ACTIVE_ORDERS: '/rider/active-orders/',
    LOGIN: '/rider/login',
    REGISTER: '/rider/register',
    VERIFICATION_SETUP: '/rider/verification-setup',
    VERIFICATION_DOCUMENTS: '/rider/verification-documents',
  },
  SELLER: {
    DASHBOARD: '/seller/dashboard',
    ORDERS: '/seller/orders',
    MENU: '/seller/menu',
    ANALYTICS: '/seller/analytics',
    SETTINGS: '/seller/settings',
  },
  BUYER: {
    HOME: '/buyer/home',
    ORDERS: '/buyer/orders',
    PROFILE: '/buyer/profile',
    SETTINGS: '/buyer/settings',
  },
};

/**
 * API Endpoints
 * Organized by module for easy discovery
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    BUYER_REGISTER: '/buyer/register/',
    BUYER_LOGIN: '/buyer/login/',
    BUYER_REFRESH_TOKEN: '/buyer/token/refresh/',
    SELLER_REGISTER: '/seller/register/',
    SELLER_LOGIN: '/seller/login/',
    SELLER_REFRESH_TOKEN: '/seller/token/refresh/',
    RIDER_REGISTER: '/rider/register/',
    RIDER_LOGIN: '/rider/login/',
    RIDER_REFRESH_TOKEN: '/rider/token/refresh/',
  },

  // Buyer endpoints
  BUYER: {
    PROFILE: '/buyer/profile/',
    PROFILE_UPDATE: '/buyer/profile/update/',
    CHANGE_PASSWORD: '/buyer/change-password/',
    LOGOUT: '/buyer/logout/',
    ADDRESSES: '/buyer/addresses/',
    ADDRESS_SEARCH: '/buyer/address/search/',
    ADDRESS_REVERSE_GEOCODE: '/buyer/address/reverse-geocode/',
    ADDRESS_VALIDATE: '/buyer/address/validate/',
    CONVERSATIONS: '/buyer/conversations/',
    CONVERSATION_DETAIL: (conversationId) => `/buyer/conversations/${conversationId}/`,
    ORDERS: '/buyer/orders/',
    ORDER_DETAIL: (orderId) => `/buyer/order-status/${orderId}/`,
    ORDER_CANCEL: (orderId) => `/buyer/orders/${orderId}/cancel/`,
    CHECKOUT: '/buyer/checkout/',
  },

  // Seller endpoints
  SELLER: {
    PROFILE: '/seller/profile/',
    PROFILE_UPDATE: '/seller/profile/update/',
    RESTAURANT_GET: '/seller/restaurant/',
    RESTAURANT_CREATE: '/seller/restaurant/create/',
    RESTAURANT_SETUP: '/seller/restaurant/setup/',
    RESTAURANT_UPDATE: '/seller/restaurant/update/',
    ORDERS: '/seller/orders/',
    ORDER_UPDATE_STATUS: (orderId) => `/seller/order/${orderId}/update-status/`,
    ORDER_MARK_READY: (orderId) => `/seller/order/${orderId}/mark-ready/`,
    ANALYTICS: '/seller/analytics/',
    PAYMENTS: '/seller/payments/',
    REVIEWS: '/seller/reviews/',
    PAYOUTS: '/seller/payouts/',
    PAYOUT_DETAILS: '/seller/payout-details/',
    MENU: '/seller/menu/',
    MENU_ADD: '/seller/menu/add/',
    MENU_UPDATE: (menuId) => `/seller/menu/${menuId}/update/`,
    MENU_DELETE: (menuId) => `/seller/menu/${menuId}/delete/`,
  },

  // Rider endpoints
  RIDER: {
    // Authentication
    REGISTER: '/rider/register/',
    LOGIN: '/rider/login/',
    LOGOUT: '/rider/logout/',
    REQUEST_PHONE_OTP: '/rider/request-phone-otp/',
    RESEND_PHONE_OTP: '/rider/resend-phone-otp/',
    VERIFY_PHONE_OTP: '/rider/verify-phone-otp/',
    
    // Profile
    PROFILE: '/rider/profile/',
    PROFILE_UPDATE: '/rider/profile/update/',
    TOGGLE_ONLINE: '/rider/profile/toggle-online/',
    VERIFICATION_STATUS: '/rider/profile/verification-status/',
    UPDATE_PROFILE_LOCATION: '/rider/profile/update-location/',
    
    // Orders
    ORDERS: '/rider/orders/',
    ORDER_DETAIL: (orderId) => `/rider/order/${orderId}/status/`, // Matches backend GET route
    ORDER_STATUS: (orderId) => `/rider/order/${orderId}/status/`,
    AVAILABLE_ORDERS: '/rider/available-orders/',
    
    // Order lifecycle
    ACCEPT_ORDER: (orderId) => `/rider/order/${orderId}/accept/`,
    REJECT_ORDER: (orderId) => `/rider/order/${orderId}/reject/`,
    ARRIVED_AT_PICKUP: (orderId) => `/rider/order/${orderId}/arrived-at-pickup/`,
    RELEASE_ORDER: (orderId) => `/rider/order/${orderId}/release/`,
    PICKUP_ORDER: (orderId) => `/rider/order/${orderId}/pickup/`,
    ON_THE_WAY: (orderId) => `/rider/order/${orderId}/on-the-way/`,
    DELIVERY_ATTEMPTED: (orderId) => `/rider/order/${orderId}/delivery-attempted/`,
    DELIVER_ORDER: (orderId) => `/rider/order/${orderId}/deliver/`,
    CANCEL_DELIVERY: (orderId) => `/rider/order/${orderId}/cancel/`,
    UPDATE_LOCATION: (orderId) => `/rider/order/${orderId}/update-location/`,
    DELIVERY_STATUS: (orderId) => `/rider/order/${orderId}/delivery-status/`,
    
    // Deliveries (use ORDERS endpoint with status filter instead)
    ESTIMATE_FEE: '/rider/estimate-delivery-fee/',
    
    // PHASE 4: Wallet, Earnings & Payouts
    WALLET: '/rider/wallet/',
    WALLET_INFO: '/rider/wallet/info/',
    WALLET_EARNINGS_TODAY: '/rider/wallet/earnings/today/',
    WALLET_EARNINGS_WEEKLY: '/rider/wallet/earnings/weekly/',
    WALLET_EARNINGS_SUMMARY: '/rider/wallet/summary/',
    WALLET_TRANSACTIONS: '/rider/wallet/transactions/',
    WALLET_WITHDRAW: '/rider/wallet/withdraw/',
    
    // PHASE 5: Payouts
    PAYOUT_REQUEST: '/rider/payout/request/',
    PAYOUT_HISTORY: '/rider/payout/history/',
    
    // PHASE 5: Disputes
    LODGE_DISPUTE: (orderId) => `/rider/disputes/lodge/${orderId}/`,
    DISPUTE_STATUS: (disputeId) => `/rider/disputes/${disputeId}/status/`,
    MY_DISPUTES: '/rider/disputes/my-disputes/',
    
    // PHASE 6: Ratings & Performance
    SUBMIT_RATING: (orderId) => `/rider/order/${orderId}/rate-rider/`,
    RIDER_RATINGS: (riderId) => `/rider/rider/${riderId}/ratings/`,
    RIDER_PERFORMANCE: (riderId) => `/rider/rider/${riderId}/performance/`,
    
    // Verification & Documents
    VERIFICATION: {
      STATUS: '/rider/profile/verification-status/',
      UPLOAD_DOCUMENT: '/rider/documents/upload/',
      DOCUMENT_STATUS: '/rider/documents/status/',
      BANK_DETAILS: '/rider/bank/add/',
      GET_BANK_DETAILS: '/rider/bank/details/',
      SERVICE_AREAS_AVAILABLE: '/rider/service-areas/available/',
      SERVICE_AREAS_GET: '/rider/service-areas/my-areas/',
      SERVICE_AREAS_SET: '/rider/service-areas/set/',
    },
  },

  // Order endpoints
  ORDERS: {
    LIST: '/buyer/orders/',
    DETAIL: (orderId) => `/buyer/order-status/${orderId}/`,
    CANCEL: (orderId) => `/buyer/orders/${orderId}/cancel/`,
  },

  // Restaurant endpoints
  RESTAURANTS: {
    LIST: '/buyer/restaurants/',
    DETAIL: (restaurantId) => `/buyer/restaurants/${restaurantId}/`,
  },

  // Menu endpoints
  MENU: {
    LIST: '/buyer/menu/',
    CATEGORIES: 'buyer/menu/categories/',
  },

  // Cart endpoints
  CART: {
    VIEW: '/buyer/cart/',
    ADD_ITEM: '/buyer/cart/add/',
    REMOVE_ITEM: (itemId) => `/buyer/cart/item/${itemId}/`,
    UPDATE_ITEM: (itemId) => `/buyer/cart/item/${itemId}/`,
    CLEAR: (vendorId) => `/buyer/cart/${vendorId}/clear/`,
  },

  // Buyer Menu endpoints
  BUYER_MENU: {
    ALL_ITEMS: '/buyer/menu/',
    GET_ITEMS: (restaurantId) => `/buyer/menu/?restaurant=${restaurantId}`,
    SEARCH: '/buyer/menu/',
  },

  // Buyer Location endpoints
  BUYER_LOCATION: {
    SAVE: '/buyer/location/',
  },

  // Phase 2: Location Management Endpoints
  LOCATION: {
    GEOCODE: '/geocode/',
    REVERSE_GEOCODE: '/reverse-geocode/',
    SAVE: '/location/save/',
    GET_CURRENT: '/location/current/',
    GET_HISTORY: '/location/history/',
    GET_RECENT: '/location/recent/',
    ESTIMATE_DELIVERY_FEE: '/estimate-delivery-fee/',
    GET_NEARBY_RESTAURANTS: '/restaurants/',
  },

  // Payment endpoints
  PAYMENT: {
    INITIALIZE: '/buyer/payment/initialize/',
    INITIALIZE_WITH_ORDER: (orderId) => `/buyer/payment/initialize/${orderId}/`,
    VERIFY: (orderId) => `/buyer/payment/verify/${orderId}/`,
    COMPLETE: '/buyer/payment/complete/',
  },

  // Rating endpoints
  RATINGS: {
    SUBMIT: '/buyer/rate/',
    SUBMIT_RIDER: (orderId) => `/rider/order/${orderId}/rate-rider/`,
  },

  // Dispute endpoints
  DISPUTES: {
    LODGE: (orderId) => `/rider/disputes/lodge/${orderId}/`,
    MY_DISPUTES: '/rider/disputes/my-disputes/',
    STATUS: (disputeId) => `/rider/disputes/${disputeId}/status/`,
  },

  // Notification endpoints
  NOTIFICATIONS: {
    UNREAD: '/rider/notifications/unread/',
    MARK_READ: (notificationId) => `/rider/notifications/${notificationId}/read/`,
    MARK_ALL_READ: '/rider/notifications/mark-all-read/',
    HISTORY: '/rider/notifications/history/',
  },

  // Real-time endpoints
  REALTIME: {
    SUBSCRIBE_ORDER: (orderId) => `/rider/order/${orderId}/subscribe/`,
    GET_LOCATION: (riderId) => `/rider/location/current/${riderId}/`,
    START_TRACKING: '/rider/location/start-tracking/',
    REGISTER_FCM_TOKEN: '/rider/fcm-token/register/',
  },

  // Waitlist endpoints
  WAITLIST: {
    LIST: '/buyer/waitlist/', // GET all waitlist entries for buyer
    DETAIL: (restaurantId) => `/buyer/waitlist/${restaurantId}/`, // GET/POST/DELETE for a specific restaurant
  },
};

/**
 * API Configuration object
 */
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Get full API URL
 * @param {string} endpoint - Endpoint path
 * @returns {string} Full API URL
 */
export const getAPIUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Get endpoint by path
 * @param {string} path - Endpoint path (e.g., 'AUTH.BUYER_LOGIN')
 * @returns {string} Full endpoint or null if not found
 */
export const getEndpoint = (path) => {
  const parts = path.split('.');
  let endpoint = API_ENDPOINTS;
  
  for (const part of parts) {
    endpoint = endpoint[part];
    if (!endpoint) return null;
  }
  
  return typeof endpoint === 'function' ? endpoint : endpoint;
};

/**
 * Environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const env = import.meta.env.VITE_ENV || globalThis?.process?.env?.NODE_ENV || 'development';
  
  const configs = {
    development: {
      API_BASE_URL: 'http://127.0.0.1:8000/api',
      DEBUG: true,
      LOG_REQUESTS: true,
      LOG_RESPONSES: true,
    },
    production: {
      API_BASE_URL: import.meta.env.VITE_API_URL || 'https://api.deliva.com/api',
      DEBUG: false,
      LOG_REQUESTS: false,
      LOG_RESPONSES: false,
    },
    staging: {
      API_BASE_URL: import.meta.env.VITE_API_URL || 'https://staging-api.deliva.com/api',
      DEBUG: true,
      LOG_REQUESTS: true,
      LOG_RESPONSES: false,
    },
  };
  
  return configs[env] || configs.development;
};

/**
 * Get API header with optional authentication
 * @param {string} token - Optional authentication token
 * @returns {object} Headers object
 */
export const getAPIHeaders = (token = null) => {
  const headers = { ...API_CONFIG.HEADERS };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Rate limiting configuration
 * Prevents too many requests to the same endpoint
 */
export const RATE_LIMIT_CONFIG = {
  ENABLED: true,
  MAX_REQUESTS: 10,
  WINDOW_MS: 60000, // 1 minute
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  ENABLED: true,
  DEFAULT_TTL: 300000, // 5 minutes
  ENDPOINTS: {
    RESTAURANTS: 600000, // 10 minutes
    MENU: 600000, // 10 minutes
    USER_PROFILE: 300000, // 5 minutes
  },
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
  getAPIUrl,
  getEndpoint,
  getEnvironmentConfig,
  getAPIHeaders,
  RATE_LIMIT_CONFIG,
  CACHE_CONFIG,
};
