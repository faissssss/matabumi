/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
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
