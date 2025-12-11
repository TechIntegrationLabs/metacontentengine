const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/**
 * Polynesian Cultural Center (PCC) Tailwind Configuration
 *
 * Brand Colors extracted from polynesia.com:
 * - Primary: Deep teal/forest green (#2d5a47) - header, navigation
 * - Secondary: Warm orange/coral (#e8734a) - CTAs, book now buttons
 * - Accent: Golden yellow (#c9a227) - highlights, sale badges
 * - Background: Warm cream/tan (#f5f0e6) - page backgrounds
 *
 * Design aesthetic: Warm, inviting, cultural/tropical with earthy tones
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        // PCC Brand Colors - warm, cultural, tropical
        void: {
          950: '#1a1512', // Deep warm brown (darkest)
          900: '#241e1a', // Warm dark brown
          800: '#2e2722', // Medium dark brown
          700: '#3d342d', // Lighter warm brown
        },
        forge: {
          accent: '#e8734a', // Warm coral/orange - CTAs
          primary: '#2d5a47', // Deep teal/forest green - primary brand
          secondary: '#c9a227', // Golden yellow - accents
        },
        // PCC-specific brand colors
        pcc: {
          teal: '#2d5a47',      // Primary brand color
          coral: '#e8734a',     // CTA buttons
          gold: '#c9a227',      // Highlights, accents
          cream: '#f5f0e6',     // Background
          sand: '#e6ddd1',      // Secondary background
          brown: '#4a3f35',     // Text/borders
          darkGreen: '#1f3d30', // Darker teal variant
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.03)',
          medium: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(45, 90, 71, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(45, 90, 71, 0.4)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(45, 90, 71, 0.2)',
        'glow-md': '0 0 20px rgba(45, 90, 71, 0.3)',
        'glow-lg': '0 0 30px rgba(45, 90, 71, 0.4)',
        'glow-accent': '0 0 20px rgba(232, 115, 74, 0.3)',
        'glow-gold': '0 0 20px rgba(201, 162, 39, 0.3)',
        'glass': 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 0 1px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.glass-card': {
          'background': 'rgba(255, 255, 255, 0.03)',
          'backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 0 1px rgba(0,0,0,1)',
        },
        '.glass-panel': {
          'background': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          'backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        // PCC-specific gradient using brand colors
        '.text-gradient': {
          'background': 'linear-gradient(to right, #2d5a47, #c9a227)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-warm': {
          'background': 'linear-gradient(to right, #e8734a, #c9a227)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': 'rgba(255,255,255,0.1) transparent',
        },
      });
    },
  ],
};
