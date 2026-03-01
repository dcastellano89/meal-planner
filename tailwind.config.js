/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF7',
        card: '#FFFFFF',
        primary: '#2D5016',
        'primary-light': '#4A7C28',
        accent: '#E8F5D0',
        'accent-dark': '#C5E89A',
        'text-main': '#1A1A1A',
        'text-muted': '#6B7280',
        border: '#E8EDE0',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        orange: '#EA580C',
      },
      fontFamily: {
        display: ["'Playfair Display'", 'Georgia', 'serif'],
        body: ["'DM Sans'", 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
