// Vehicle Types
export const VEHICLE_TYPES = {
  BIKE: 'bike',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
  SCOOTER: 'scooter',
};

export const VEHICLE_TYPE_LABELS = {
  bike: '🚴 Bike',
  motorcycle: '🏍️ Motorcycle',
  car: '🚗 Car',
  scooter: '🛵 Scooter',
};

// Account Statuses
export const ACCOUNT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
};

export const ACCOUNT_STATUS_LABELS = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
};

export const ACCOUNT_STATUS_COLORS = {
  pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' },
  approved: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800' },
  rejected: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800' },
  suspended: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  deactivated: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-800' },
};

// Profile Completion Stages
export const PROFILE_COMPLETION_STAGES = [
  { name: 'Basic Info', percentage: 25, completed: true },
  { name: 'Vehicle', percentage: 25, completed: false },
  { name: 'Documents', percentage: 25, completed: false },
  { name: 'Bank Details', percentage: 25, completed: false },
];

// Validation Rules
export const SETTINGS_VALIDATION = {
  NAME_MIN: 3,
  NAME_MAX: 100,
  PHONE_MIN: 10,
  PHONE_MAX: 15,
  PLATE_MIN: 3,
  PLATE_MAX: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Form Default Values
export const DEFAULT_PROFILE_FORM = {
  full_name: '',
  phone_number: '',
  email: '',
  vehicle_type: '',
  vehicle_plate_number: '',
};

export const DEFAULT_PREFERENCES_FORM = {
  max_delivery_distance: 10,
  accepts_short_deliveries: true,
  accepts_food_orders: true,
  accepts_grocery_orders: true,
  notification_push: true,
  notification_sms: false,
  notification_email: false,
};

// Verification Checklist Items
export const VERIFICATION_CHECKLIST = [
  {
    id: 'phone',
    label: 'Phone Verified',
    description: 'Verify your phone number with OTP',
    priority: 'high',
  },
  {
    id: 'documents',
    label: 'Documents Approved',
    description: 'Upload required identification documents',
    priority: 'high',
  },
  {
    id: 'bank',
    label: 'Bank Details Added',
    description: 'Add your bank account for payouts',
    priority: 'high',
  },
  {
    id: 'online',
    label: 'Go Online',
    description: 'Activate your account to start accepting orders',
    priority: 'high',
  },
];

// OTP Configuration
export const OTP_CONFIG = {
  MAX_ATTEMPTS: 3,
  RESEND_TIMER: 60, // seconds
  OTP_LENGTH: 6,
  EXPIRY_TIME: 600, // seconds
};

// Error Messages
export const SETTINGS_ERRORS = {
  INVALID_NAME: `Name must be between ${SETTINGS_VALIDATION.NAME_MIN} and ${SETTINGS_VALIDATION.NAME_MAX} characters`,
  INVALID_PHONE: `Phone number must be between ${SETTINGS_VALIDATION.PHONE_MIN} and ${SETTINGS_VALIDATION.PHONE_MAX} digits`,
  INVALID_PHONE_FORMAT: 'Please enter a valid phone number',
  INVALID_PLATE: `Plate number must be between ${SETTINGS_VALIDATION.PLATE_MIN} and ${SETTINGS_VALIDATION.PLATE_MAX} characters`,
  PLATE_REQUIRED: 'Plate number is required',
  INVALID_VEHICLE_TYPE: 'Please select a vehicle type',
  VEHICLE_TYPE_REQUIRED: 'Vehicle type is required',
  PHONE_REQUIRED: 'Phone number is required',
  NAME_REQUIRED: 'Name is required',
  INVALID_OTP: 'Please enter a valid 6-digit OTP',
  OTP_EXPIRED: 'OTP has expired. Please request a new one',
  OTP_INCORRECT: 'The OTP you entered is incorrect. Please try again',
  MAX_ATTEMPTS_EXCEEDED: 'Maximum OTP attempts exceeded. Please request a new OTP',
  PROFILE_UPDATE_FAILED: 'Failed to update profile. Please try again',
  PHONE_VERIFICATION_FAILED: 'Phone verification failed. Please try again',
  VERIFICATION_STATUS_FAILED: 'Failed to update verification status. Please try again',
  OTP_REQUEST_FAILED: 'Failed to request OTP. Please try again',
  FETCH_PROFILE_FAILED: 'Failed to load profile. Please try again',
  UNKNOWN_ERROR: 'Something went wrong. Please try again',
};

// Success Messages
export const SETTINGS_SUCCESS = {
  PROFILE_UPDATED: '✓ Profile updated successfully',
  PHONE_VERIFIED: '✓ Phone verified successfully',
  PREFERENCES_SAVED: '✓ Preferences saved successfully',
  VEHICLE_UPDATED: '✓ Vehicle information updated',
  STATUS_CHANGED: '✓ Status updated successfully',
  OTP_SENT: '○ OTP sent to your phone',
  OTP_RESENT: '○ New OTP has been sent',
};

// Info Messages
export const SETTINGS_INFO = {
  PHONE_VERIFICATION_INFO: 'We will send a verification code to your phone number',
  PHONE_VERIFIED: 'Phone Verified',
  PHONE_VERIFIED_DESC: 'Your phone is verified!',
  CHANGE_NUMBER: 'Change Number',
  ENTER_OTP: 'Enter OTP',
  ENTER_6_DIGIT_OTP: 'Enter the 6-digit code sent to your phone',
  OTP_EXPIRES_IN: 'OTP expires in',
  OTP_PLACEHOLDER: '000000',
  RESEND_OTP: 'Resend OTP',
  VERIFY_OTP: 'Verify OTP',
  SEND_OTP: 'Send OTP',
  SENDING_OTP: 'Sending OTP...',
  VERIFYING: 'Verifying...',
  MAX_DELIVERY_DISTANCE: '📍 Maximum Delivery Distance',
  ORDER_TYPES_HEADER: '📦 Order Types',
  NOTIFICATIONS_HEADER: '🔔 Notifications',
};

// Section Headers & Labels
export const SETTINGS_LABELS = {
  BASIC_INFO: '👤 Basic Information',
  VEHICLE_INFO: '🚚 Vehicle Information',
  PHONE_VERIFICATION: 'Phone Verification',
  DELIVERY_PREFERENCES: '⚙️ Delivery Preferences',
  ACCOUNT_STATUS: 'Account Status',
  ACCOUNT_ACTIONS: 'Account Actions',
  FULL_NAME: 'Full Name',
  PHONE_NUMBER: 'Phone Number',
  EMAIL: 'Email',
  EMAIL_INFO: 'Email cannot be changed',
  VEHICLE_TYPE: 'Vehicle Type',
  SELECT_VEHICLE: '-- Select a vehicle type --',
  LICENSE_PLATE: 'License Plate Number',
  PLATE_EXAMPLE: 'e.g., ABC123XYZ',
  SAVE_CHANGES: 'Save Changes',
  SAVING: 'Saving...',
  CANCEL: 'Cancel',
  SETTINGS: 'Settings',
  MANAGE_PROFILE: 'Manage your profile and preferences',
  LOADING_SETTINGS: 'Loading settings...',
};
export const DISTANCE_RANGE = {
  MIN: 5,
  MAX: 50,
  STEP: 1,
  DEFAULT: 10,
};

// Notification Types
export const NOTIFICATION_TYPES = {
  PUSH: 'notification_push',
  SMS: 'notification_sms',
  EMAIL: 'notification_email',
};

export const NOTIFICATION_LABELS = {
  notification_push: 'Push Notifications',
  notification_sms: 'SMS Notifications',
  notification_email: 'Email Notifications',
};

// Order Type Preferences
export const ORDER_TYPE_PREFERENCES = {
  FOOD: 'accepts_food_orders',
  GROCERY: 'accepts_grocery_orders',
  SHORT_DELIVERY: 'accepts_short_deliveries',
};

export const ORDER_TYPE_LABELS = {
  accepts_food_orders: 'Food & Restaurant Orders',
  accepts_grocery_orders: 'Grocery Orders',
  accepts_short_deliveries: 'Short Distance Deliveries',
};
