/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Add critical classes that might be dynamically created
    'bg-primary-500',
    'text-primary-500',
    'border-primary-500',
    'hover:bg-primary-600',
    'text-white',
    'bg-white',
    'bg-gray-50',
    'bg-gray-100',
    'text-gray-500',
    'text-gray-700',
    'text-gray-900',
    // Essential Flexbox utilities
    'flex',
    'flex-col',
    'flex-row',
    'items-center',
    'justify-center',
    'justify-between',
    // Layout utilities
    'container',
    'mx-auto',
    'w-full',
    'h-screen',
    // Button utilities
    'btn',
    'btn-primary',
    // Spacing utilities
    'p-4',
    'm-4',
    'my-4',
    'mx-4'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9ff',
          300: '#a4beff',
          400: '#8199ff',
          500: '#4a6cf7', // Main brand color
          600: '#3a57d7',
          700: '#2a47b7',
          800: '#1a3797',
          900: '#0a2777',
        },
        secondary: {
          50: '#f5f5f5',
          100: '#ebebeb',
          200: '#d6d6d6',
          300: '#c2c2c2',
          400: '#adadad',
          500: '#999999',
          600: '#858585',
          700: '#707070',
          800: '#5c5c5c',
          900: '#474747',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
  important: true, // This ensures Tailwind styles take precedence
} 