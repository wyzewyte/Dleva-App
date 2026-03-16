/**
 * Responsive Design Configuration & Utilities
 * Standardizes responsive breakpoints and design patterns across the app
 */

// Tailwind breakpoints
export const BREAKPOINTS = {
  xs: 0,      // Mobile (default)
  sm: 640,    // Small devices, large phones
  md: 768,    // Tablets, small tablets
  lg: 1024,   // Tablets, small laptops
  xl: 1280,   // Desktop
  '2xl': 1536 // Large desktop
};

// Common responsive Tailwind class patterns
export const RESPONSIVE_PATTERNS = {
  // Grid Patterns
  gridResponsive: {
    twoColumn: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    threeColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    fourColumn: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
    autoGrid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-max gap-4',
  },

  // Layout Patterns
  layoutResponsive: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    containerTight: 'max-w-4xl mx-auto px-4 sm:px-6',
    sectionPadding: 'px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10',
    pageContent: 'space-y-4 sm:space-y-6 md:space-y-8',
  },

  // Text Patterns
  textResponsive: {
    heading1: 'text-2xl sm:text-3xl md:text-4xl font-bold',
    heading2: 'text-xl sm:text-2xl md:text-3xl font-bold',
    heading3: 'text-lg sm:text-xl md:text-2xl font-semibold',
    body: 'text-sm sm:text-base md:text-base',
    caption: 'text-xs sm:text-sm',
  },

  // Spacing Patterns
  spacingResponsive: {
    gapSmall: 'gap-2 sm:gap-3 md:gap-4',
    gapMedium: 'gap-3 sm:gap-4 md:gap-6',
    gapLarge: 'gap-4 sm:gap-6 md:gap-8',
    marginY: 'my-4 sm:my-6 md:my-8',
    paddingY: 'py-4 sm:py-6 md:py-8',
  },

  // Button Patterns
  buttonResponsive: {
    primary: 'px-3 sm:px-4 py-2 sm:py-3 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]',
    secondary: 'px-3 sm:px-4 py-2 sm:py-2.5 font-medium text-sm min-h-[44px]',
    icon: 'p-2.5 sm:p-3 min-h-[44px] min-w-[44px]',
  },
};

// Responsive container configurations
export const RESPONSIVE_CONTAINERS = {
  // Mobile-first sidebar layouts
  sidebarLayout: {
    wrapper: 'flex min-h-screen',
    sidebar: 'hidden md:block w-64 bg-white border-r border-gray-200',
    content: 'flex-1 overflow-auto',
    mobileHeader: 'md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4',
  },

  // Mobile-first top-bar layouts
  topBarLayout: {
    headerDesktop: 'hidden md:flex h-16 bg-white border-b border-gray-200 items-center',
    headerMobile: 'md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4',
    contentArea: 'pt-14 md:pt-16',
  },

  // Responsive card layouts
  cardLayout: {
    card: 'bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow',
    cardPadding: 'p-3 sm:p-4 md:p-6',
    cardCompact: 'p-3 sm:p-4',
  },
};

// Mobile-safe touch target sizes (minimum 44x44px recommended)
export const TOUCH_TARGETS = {
  small: 'h-10 w-10 min-h-[40px] min-w-[40px]',     // 40px
  medium: 'h-11 w-11 min-h-[44px] min-w-[44px]',    // 44px (recommended minimum)
  large: 'h-12 w-12 min-h-[48px] min-w-[48px]',     // 48px
  xlarge: 'h-14 w-14 min-h-[56px] min-w-[56px]',    // 56px
};

// Responsive padding for mobile
export const MOBILE_SAFE_PADDING = {
  normal: 'px-4 py-4',                    // Standard mobile padding
  tight: 'px-3 py-2',                      // Tight spacing
  loose: 'px-6 py-6',                      // Loose spacing
  bottom: 'pb-20 sm:pb-24 md:pb-20',       // Bottom nav padding
};

// Helper function to check if component is on mobile
export const mediaQuery = {
  isMobile: () => typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.md,
  isTablet: () => typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg,
  isDesktop: () => typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS.lg,
};

export default RESPONSIVE_PATTERNS;
