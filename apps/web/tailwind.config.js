/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy brand (being phased out)
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        // StayNest design system
        forest: {
          900: '#26332D',
          800: '#1E2924',
          700: '#1a2320',
        },
        sage: {
          50: '#F2F5EE',
          100: '#DDE5D8',
          200: '#C4D3BB',
          300: '#9BB09C',
          400: '#879B89',
          500: '#6B756E',
          600: '#526653',
          700: '#435645',
          800: '#354437',
        },
        warm: {
          50: '#FAF9F6',
          100: '#F5F4EF',
          200: '#E8E6DF',
          300: '#E0E4DE',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-lg': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};