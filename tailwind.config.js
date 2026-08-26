/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#FAFAF8',
        point: '#4A9E8E',
        'point-dark': '#3A8474',
        'point-light': '#6BB5A5',
        text: '#2A2A28',
        'text-sub': '#6A6A68',
        letter: '#F5F0E0',
        golden: '#F0E890',
        error: '#C84A4A',
        'purple-bg': '#EDE8F5',
        'purple-bg-dark': '#D8CCF0',
      },
      fontFamily: {
        batang: ['"Gowun Batang"', 'serif'],
        sans: ['"Pretendard"', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        imperial: ['"Imperial Script"', 'cursive'],
      },
      maxWidth: {
        mobile: '430px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        darken: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        forestReveal: {
          '0%': { opacity: '0', transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-out forwards',
        fadeOut: 'fadeOut 0.6s ease-out forwards',
        fadeUp: 'fadeUp 0.7s ease-out forwards',
        blink: 'blink 1s step-end infinite',
        float: 'float 4s ease-in-out infinite',
        scaleIn: 'scaleIn 0.6s ease-out forwards',
        darken: 'darken 1.5s ease-in forwards',
        forestReveal: 'forestReveal 2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
