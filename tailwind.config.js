/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8edf3',
          100: '#c5d0de',
          200: '#9fb0c6',
          300: '#7990ae',
          400: '#5e789c',
          500: '#43608a',
          600: '#355278',
          700: '#243e61',
          800: '#152b4a',
          900: '#0d1b2a',
          950: '#07111b',
        },
        accent: {
          50: '#fdf3ec',
          100: '#fae1cc',
          200: '#f5c49a',
          300: '#efa368',
          400: '#e88040',
          500: '#e07b39',
          600: '#c8622a',
          700: '#a84d1f',
          800: '#883c18',
          900: '#6e2f13',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
