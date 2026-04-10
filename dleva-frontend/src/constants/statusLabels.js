/**
 * Order Status Labels and Styling
 * Single source of truth for all order statuses across the application
 */

export const ORDER_STATUSES = {
  // Buyer/Seller statuses
  pending: {
    label: 'Order Placed',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-l-blue-500',
    icon: '⏳',
    description: 'Waiting for confirmation',
    step: 1
  },
  confirming: {
    label: 'Restaurant Accepted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-l-blue-400',
    icon: '✓',
    description: 'Seller is confirming',
    step: 2
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-l-green-500',
    icon: '✓',
    description: 'Order confirmed',
    step: 2
  },
  preparing: {
    label: 'Cooking Your Order',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-l-orange-500',
    icon: '👨‍🍳',
    description: 'Being prepared',
    step: 2
  },
  ready: {
    label: 'Ready',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-l-green-500',
    icon: '📦',
    description: 'Ready for pickup',
    step: 3
  },
  available_for_pickup: {
    label: 'Ready for Rider',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-l-green-500',
    icon: '📦',
    description: 'Available for pickup',
    step: 3
  },
  awaiting_rider: {
    label: 'Finding Rider',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-l-green-400',
    icon: '🔍',
    description: 'Waiting for rider',
    step: 3
  },
  assigned: {
    label: 'Rider Assigned',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-l-green-300',
    icon: '✓',
    description: 'Rider assigned',
    step: 3
  },

  // Rider statuses
  arrived_at_pickup: {
    label: 'Rider at Restaurant',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-l-purple-500',
    icon: '🏍️',
    description: 'Rider at restaurant',
    step: 4
  },
  picked_up: {
    label: 'On The Way',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-l-purple-400',
    icon: '🚚',
    description: 'Order picked up',
    step: 4
  },
  on_the_way: {
    label: 'On The Way',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-l-indigo-500',
    icon: '🛣️',
    description: 'Delivering now',
    step: 4
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-l-green-600',
    icon: '✅',
    description: 'Successfully delivered',
    step: 5
  },
  delivery_attempted: {
    label: 'Delivery Attempted',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-l-orange-400',
    icon: '📍',
    description: 'Delivery attempt was made',
    step: 4
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-l-red-400',
    icon: '✗',
    description: 'Order cancelled',
    step: 0
  },
  cancelled_by_seller: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-l-red-400',
    icon: '✗',
    description: 'Seller cancelled order',
    step: 0
  },
  cancelled_by_buyer: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-l-red-400',
    icon: '✗',
    description: 'Buyer cancelled order',
    step: 0
  }
};

/**
 * Get status label by status key
 * @param {string} statusKey - The status key (e.g., 'pending', 'preparing')
 * @returns {object} Status object with label, color, bgColor, icon, description
 */
export const getStatusLabel = (statusKey) => {
  return ORDER_STATUSES[statusKey] || {
    label: statusKey?.replace(/_/g, ' ')?.toUpperCase() || 'Unknown',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '?',
    description: 'Unknown status'
  };
};

/**
 * Get status color for styling (Tailwind class)
 * @param {string} statusKey - The status key
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (statusKey) => {
  return getStatusLabel(statusKey).color;
};

/**
 * Get status background color (Tailwind class)
 * @param {string} statusKey - The status key
 * @returns {string} Tailwind background color class
 */
export const getStatusBgColor = (statusKey) => {
  return getStatusLabel(statusKey).bgColor;
};

/**
 * Get status icon
 * @param {string} statusKey - The status key
 * @returns {string} Icon emoji/symbol
 */
export const getStatusIcon = (statusKey) => {
  return getStatusLabel(statusKey).icon;
};

export default ORDER_STATUSES;
