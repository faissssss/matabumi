/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // MataBumi 2.0 Color Palette
        'canopy-green': '#1A4D2E',
        'forest-dark': '#0D1F15',
        'mist-white': '#F0F4F1',
        'alert-orange': '#EA580C',
        'glass-surface': 'rgba(255, 255, 255, 0.06)',
        
        // Light mode variants
        'light-bg': '#F4F7F5',
        'light-surface': 'rgba(255, 255, 255, 0.85)',
        'light-text': '#0D1F15',
        
        // Legacy colors (keep for compatibility)
        canopy: '#0f3d31',
        earth: '#b56b3f',
        river: '#2f80ed',
        ember: '#d9480f',
        paper: '#f7f5ef',
      },
    },
  },
  plugins: [],
};

