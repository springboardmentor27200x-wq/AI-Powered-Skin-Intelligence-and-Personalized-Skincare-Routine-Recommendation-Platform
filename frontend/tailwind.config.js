/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7f6',
          100: '#e6edea',
          200: '#ccdcd6',
          300: '#a3c0b5',
          400: '#759f90',
          50: '#588173',
          600: '#43685c',
          700: '#38534b',
          800: '#2f433d',
          900: '#283732',
        }
      }
    },
  },
  plugins: [],
}
