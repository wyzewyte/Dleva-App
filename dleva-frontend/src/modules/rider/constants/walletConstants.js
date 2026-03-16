/**
 * Rider Wallet & Payout Constants
 * Centralized constants for Phase 4 Earnings & Wallet features
 */

/**
 * Payout Configuration
 */
export const PAYOUT_CONFIG = {
  MINIMUM_AMOUNT: 2000, // ₦2,000 minimum
  CURRENCY: '₦',
  CURRENCY_CODE: 'NGN',
  DEFAULT_PAGE_SIZE: 20,
  PAGINATION_LIMIT: 20,
};

/**
 * Payout Status Enum
 * Matches backend payout status values
 */
export const PAYOUT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  FAILED: 'failed',
};

/**
 * Payout Status Display Labels
 */
export const PAYOUT_STATUS_LABELS = {
  [PAYOUT_STATUSES.PENDING]: 'Pending Review',
  [PAYOUT_STATUSES.APPROVED]: 'Approved',
  [PAYOUT_STATUSES.PROCESSING]: 'Processing',
  [PAYOUT_STATUSES.COMPLETED]: 'Completed',
  [PAYOUT_STATUSES.REJECTED]: 'Rejected',
  [PAYOUT_STATUSES.FAILED]: 'Failed',
};

/**
 * Payout Status Colors (Tailwind classes)
 */
export const PAYOUT_STATUS_COLORS = {
  [PAYOUT_STATUSES.PENDING]: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  [PAYOUT_STATUSES.APPROVED]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  [PAYOUT_STATUSES.PROCESSING]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  [PAYOUT_STATUSES.COMPLETED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  [PAYOUT_STATUSES.REJECTED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  [PAYOUT_STATUSES.FAILED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

/**
 * Dispute Status Enum
 * Matches backend dispute status values
 */
export const DISPUTE_STATUSES = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  APPEALED: 'appealed',
};

/**
 * Dispute Status Display Labels
 */
export const DISPUTE_STATUS_LABELS = {
  [DISPUTE_STATUSES.OPEN]: 'Open',
  [DISPUTE_STATUSES.UNDER_REVIEW]: 'Under Review',
  [DISPUTE_STATUSES.RESOLVED]: 'Resolved',
  [DISPUTE_STATUSES.CLOSED]: 'Closed',
  [DISPUTE_STATUSES.APPEALED]: 'Appealed',
};

/**
 * Dispute Status Colors (Tailwind classes)
 */
export const DISPUTE_STATUS_COLORS = {
  [DISPUTE_STATUSES.OPEN]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  [DISPUTE_STATUSES.UNDER_REVIEW]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  [DISPUTE_STATUSES.RESOLVED]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  [DISPUTE_STATUSES.CLOSED]: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  [DISPUTE_STATUSES.APPEALED]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

/**
 * Dispute Reasons
 */
export const DISPUTE_REASONS = {
  PAYMENT_NOT_RECEIVED: 'Payment not received',
  PARTIAL_PAYMENT: 'Partial payment received',
  WRONG_AMOUNT: 'Wrong amount paid',
  FRAUDULENT_CLAIM: 'Fraudulent claim',
  DELIVERY_ISSUE: 'Delivery not completed properly',
  CUSTOMER_COMPLAINT: 'Customer raised a complaint',
  OTHER: 'Other',
};

/**
 * Transaction Types
 */
export const TRANSACTION_TYPES = {
  EARNINGS: 'earnings',
  BONUS: 'bonus',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment',
  INCENTIVE: 'incentive',
};

/**
 * Transaction Type Display Labels
 */
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.EARNINGS]: 'Delivery Earnings',
  [TRANSACTION_TYPES.BONUS]: 'Bonus',
  [TRANSACTION_TYPES.WITHDRAWAL]: 'Withdrawal',
  [TRANSACTION_TYPES.REFUND]: 'Refund',
  [TRANSACTION_TYPES.ADJUSTMENT]: 'Adjustment',
  [TRANSACTION_TYPES.INCENTIVE]: 'Incentive',
};

/**
 * Rating Scale
 */
export const RATING_SCALE = {
  MIN: 1,
  MAX: 5,
  DEACTIVATION_THRESHOLD: 3.0, // Riders deactivated below this
  WARNING_THRESHOLD: 3.5, // Warning issued at this level
};

/**
 * Performance Metrics Configuration
 */
export const PERFORMANCE_CONFIG = {
  ACCEPTANCE_RATE_THRESHOLD: 0.6, // 60% minimum
  COMPLETION_RATE_THRESHOLD: 0.8, // 80% minimum
  ON_TIME_DELIVERY_THRESHOLD: 0.7, // 70% minimum
  MINIMUM_DELIVERIES_FOR_RANKING: 10,
};

/**
 * Validation Rules
 */
export const WALLET_VALIDATION = {
  PAYOUT_AMOUNT_MIN: PAYOUT_CONFIG.MINIMUM_AMOUNT,
  PAYOUT_AMOUNT_MAX: 1000000, // ₦1M maximum per request
  DISPUTE_DESCRIPTION_MIN: 10,
  DISPUTE_DESCRIPTION_MAX: 500,
  RATING_COMMENT_MIN: 0,
  RATING_COMMENT_MAX: 500,
};

/**
 * Error Messages for Payout
 */
export const PAYOUT_ERRORS = {
  INSUFFICIENT_BALANCE: `Insufficient balance. Minimum payout is ${PAYOUT_CONFIG.CURRENCY}${PAYOUT_CONFIG.MINIMUM_AMOUNT.toLocaleString()}`,
  MINIMUM_AMOUNT_NOT_MET: `Minimum payout is ${PAYOUT_CONFIG.CURRENCY}${PAYOUT_CONFIG.MINIMUM_AMOUNT.toLocaleString()}`,
  MAXIMUM_AMOUNT_EXCEEDED: 'Maximum payout amount exceeded',
  INVALID_BANK_ACCOUNT: 'Please select a valid bank account',
  NO_BANK_ACCOUNTS: 'No bank accounts found. Please add one first.',
  PAYOUT_IN_PROGRESS: 'A payout is already in progress. Please wait.',
  FREQUENT_REQUESTS: 'Too many payout requests. Please wait before trying again.',
};

/**
 * Warning Messages for Wallet
 */
export const WALLET_WARNINGS = {
  LOW_BALANCE: 'Your wallet balance is running low',
  PENDING_WITHDRAWAL: 'You have a pending withdrawal request',
  DISPUTE_OPEN: 'You have an open dispute',
};

/**
 * Success Messages for Wallet
 */
export const WALLET_SUCCESS = {
  PAYOUT_REQUESTED: 'Payout request submitted successfully',
  DISPUTE_LODGED: 'Dispute lodged successfully',
  RATING_SUBMITTED: 'Rating submitted successfully',
  WALLET_UPDATED: 'Wallet updated',
};

/**
 * Wallet State Configuration
 */
export const WALLET_STATE = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  SUSPENDED: 'suspended',
};

/**
 * Wallet State Display Labels
 */
export const WALLET_STATE_LABELS = {
  [WALLET_STATE.ACTIVE]: 'Active',
  [WALLET_STATE.FROZEN]: 'Frozen',
  [WALLET_STATE.SUSPENDED]: 'Suspended',
};

export default {
  PAYOUT_CONFIG,
  PAYOUT_STATUSES,
  PAYOUT_STATUS_LABELS,
  PAYOUT_STATUS_COLORS,
  DISPUTE_STATUSES,
  DISPUTE_STATUS_LABELS,
  DISPUTE_STATUS_COLORS,
  DISPUTE_REASONS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  RATING_SCALE,
  PERFORMANCE_CONFIG,
  WALLET_VALIDATION,
  PAYOUT_ERRORS,
  WALLET_WARNINGS,
  WALLET_SUCCESS,
  WALLET_STATE,
  WALLET_STATE_LABELS,
};
