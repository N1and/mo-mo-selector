/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#2D5A3D',
          light: '#4A7C5C',
          50: '#E8F0EB',
          100: '#C5DBC9',
          200: '#9EC2A5',
          300: '#78A982',
          400: '#5C9668',
          500: '#4A7C5C',
          600: '#3D6A4E',
          700: '#2D5A3D',
          800: '#234730',
          900: '#193323',
        },
        success: '#52C41A',
        warning: '#FAAD14',
        error: '#FF4D4F',
      },
      borderRadius: {
        'btn': '8px',
        'card': '12px',
        'tag': '999px',
      },
      spacing: {
        'page': '24px',
        'card': '16px',
        'gap': '16px',
        'compact': '8px',
      },
      fontSize: {
        'title': '20px',
        'subtitle': '16px',
        'body': '14px',
        'caption': '12px',
      },
    },
  },
  plugins: [],
}