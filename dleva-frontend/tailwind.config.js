/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dleva Brand Colors ──────────────────────────────
        primary: {
          DEFAULT: '#1a4731',  // Deep Forest Green
          hover: '#153b28',    // Darker green for hover
          light: '#e8f0eb',    // Light green tint for backgrounds/badges
        },
        accent: {
          DEFAULT: '#f47b00',  // Orange
          hover: '#d96e00',    // Darker orange for hover
          light: '#fff3e0',    // Light orange tint
        },

        // ── Backgrounds ─────────────────────────────────────
        bg: '#ffffff',         // White buyer background
        surface: '#ffffff',    // Pure white — cards & panels

        // ── Text ────────────────────────────────────────────
        dark: '#141414',       // Dark neutral — headings
        muted: '#6b7280',      // Grey — subtext

        // ── Status ──────────────────────────────────────────
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
