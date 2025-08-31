/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins','Inter','system-ui','sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef7ff',
          100: '#d8eaff',
          200: '#b6d4ff',
          300: '#8fb9ff',
          400: '#5c93ff',
          500: '#3a78ff',
          600: '#245fe8',
          700: '#1d49be',
          800: '#183c97',
          900: '#132f76'
        }
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0,0,0,0.07)'
      }
    },
  },
  plugins: [],
}
