/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
      colors: {
        ink: '#0A1628',
        deep: '#062B4D',
        ocean: '#0B4F8C',
        tide: '#1E88C9',
        cyan: '#5BC8E6',
        mist: '#E8F4FA',
        ice: '#F4FAFD',
      },
      keyframes: {
        drip: {
          '0%':   { transform: 'translateY(-100%) scaleY(0.6)', opacity: '0' },
          '20%':  { opacity: '1' },
          '100%': { transform: 'translateY(140%) scaleY(1.4)', opacity: '0' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        drip: 'drip 1.4s ease-in infinite',
        ripple: 'ripple 0.7s ease-out forwards',
        shimmer: 'shimmer 8s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
