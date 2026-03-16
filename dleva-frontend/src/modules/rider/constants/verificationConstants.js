/**
 * Rider Document Verification Constants
 * Document types, statuses, validation rules, and messages
 */

export const DOCUMENT_TYPES = {
  ID_CARD: 'id_card',
  DRIVER_LICENSE: 'driver_license',
  STUDENT_ID: 'student_id',
};

export const DOCUMENT_TYPE_LABELS = {
  id_card: 'ID Card',
  driver_license: "Driver's License",
  student_id: 'Student ID',
};

export const DOCUMENT_TYPE_DESCRIPTIONS = {
  id_card: 'Upload a clear image of your national ID or passport (front and back)',
  driver_license: 'Upload a clear image of your driver license (front and back)',
  student_id: 'Upload a clear image of your student ID (front and back)',
};

export const DOCUMENT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export const DOCUMENT_STATUS_COLORS = {
  pending: 'bg-yellow-50 border-yellow-200',
  approved: 'bg-green-50 border-green-200',
  rejected: 'bg-red-50 border-red-200',
  expired: 'bg-orange-50 border-orange-200',
};

export const DOCUMENT_STATUS_TEXT_COLORS = {
  pending: 'text-yellow-700',
  approved: 'text-green-700',
  rejected: 'text-red-700',
  expired: 'text-orange-700',
};

export const DOCUMENT_STATUS_BADGES = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
};

export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
};

export const VERIFICATION_ERRORS = {
  FILE_TOO_LARGE: `File size exceeds ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB limit`,
  INVALID_FORMAT: 'Only JPEG, PNG, and PDF files are allowed',
  FILE_REQUIRED: 'Please select a file to upload',
  UPLOAD_FAILED: 'Failed to upload document. Please try again.',
  NO_DOCUMENTS: 'No documents uploaded yet',
  EMPTY_FIELD: 'Please fill in all required fields',
};

export const VERIFICATION_SUCCESS = {
  UPLOAD_SUCCESS: '✓ Document uploaded successfully',
  ALL_VERIFIED: '✓ All documents verified',
  PENDING_REVIEW: 'Your documents are under review',
};

export const VERIFICATION_INFO = {
  UPLOAD_HINT: 'Upload clear, legible photos or documents',
  REJECTION_REASON: 'Document was rejected. Reason:',
  RESUBMIT_ALLOWED: 'You can resubmit this document',
  VERIFICATION_PROCESS: 'Documents are reviewed within 24-48 hours',
};

export const DOCUMENT_REQUIREMENTS = {
  id_card: {
    required: true,
    label: 'ID Card',
    description: 'Clear, legible front and back',
  },
  driver_license: {
    required: true,
    label: "Driver's License",
    description: 'Clear, legible front and back',
  },
  student_id: {
    required: false,
    label: 'Student ID',
    description: 'Optional - if available',
  },
};

export const VERIFICATION_TABS = [
  { id: 'pending', label: 'Pending', count: 'pending' },
  { id: 'approved', label: 'Approved', count: 'approved' },
  { id: 'rejected', label: 'Rejected', count: 'rejected' },
];
