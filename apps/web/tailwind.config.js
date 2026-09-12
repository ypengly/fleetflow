/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#2563eb',
          600: '#1d4ed8',
          900: '#1e3a5f',
        },
      },
    },
  },
  plugins: [],
};
