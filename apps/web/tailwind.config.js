/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#2F4156',
          dark: '#1E2C3A',
          light: '#3E546E',
          50: '#F0F4F8',
        },
        teal: {
          DEFAULT: '#567C8D',
          dark: '#3F5E6C',
          light: '#769BAE',
          50: '#EBF2F5',
        },
        sky: {
          DEFAULT: '#C8D9E6',
          light: '#F0F5F9',
          dark: '#A1BFD3',
        },
        beige: {
          DEFAULT: '#F5EFEB',
          light: '#FAF7F5',
          dark: '#E7DFD7',
        },
        cream: '#FFF7E6',
        sage: {
          DEFAULT: '#A6B58A',
          light: '#F0F5EA',
          dark: '#7D8C62',
        },
        rosewood: {
          DEFAULT: '#B46A72',
          light: '#F9ECEE',
          dark: '#934E55',
        },
      },
    },
  },
  plugins: [],
};
