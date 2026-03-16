/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dleva Brand Colors
        primary: {
          DEFAULT: '#000346', // The main Dleva blue
          hover: '#00079b',   // Darker blue for hover states
          light: '#000ae0',   // Light blue for backgrounds/badges
        },
        // Backgrounds
        bg: '#f3f4f6',      // Light Grey for app background
        surface: '#ffffff', // Pure white for cards
        
        // Text
        dark: '#111827',    // Almost black (for headings)
        muted: '#6b7280',   // Grey (for subtext)
        
        // Status Indicators
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}