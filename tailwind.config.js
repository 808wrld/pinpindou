/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '"PingFang SC"', '"Noto Sans CJK SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
