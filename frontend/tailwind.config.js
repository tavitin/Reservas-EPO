export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50:  '#EEF3FB',
          100: '#D5E0F4',
          200: '#ABBFE9',
          300: '#819FDE',
          400: '#577ED3',
          500: '#2D5EC8',
          600: '#1F4EA1',
          700: '#193E80',
          800: '#0D2C5E',
          900: '#081C3D',
          950: '#040E1F',
        },
        gray: {
          50:  '#f8f9fb',
          100: '#eef0f4',
          150: '#e4e7ed',
          200: '#d4d8e2',
          300: '#b0b8c8',
          400: '#8c97ac',
          500: '#677690',
          600: '#4d5a70',
          700: '#344256',
          800: '#1a2744',
          900: '#131c2f',
          950: '#0e1525',
        },
        accent: {
          300: '#F8E08A',
          400: '#F5D76E',
          500: '#F2C94C',
          600: '#D4AA2A',
          700: '#A8830D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
