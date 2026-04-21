/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E5269',
        secondary: '#3B82F6',
        accent: '#10B981',
        dark: '#1F2937',
        light: '#F9FAFB',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'float': '0 8px 40px rgba(0, 0, 0, 0.08)',
        'float-sm': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'float-lg': '0 16px 60px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}