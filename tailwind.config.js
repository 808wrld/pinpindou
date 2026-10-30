/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F1E3',
        'paper-2': '#EFE7D2',
        'paper-3': '#E5DCC3',
        ink: '#1A1815',
        'ink-2': '#2A2722',
        // Text colors meet WCAG AA (4.5:1) on paper / paper-2.
        mute: '#686255',
        rule: '#D8CFB8',
        accent: '#C42B37',
        'accent-2': '#A8232F',
        ok: '#2A9D8F',
      },
      fontFamily: {
        display: ['"Instrument Serif"', '"Source Han Serif SC"', '"Songti SC"', 'STSong', 'serif'],
        sans: ['Geist', '"PingFang SC"', '"Source Han Sans SC"', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        specimen: '0 1px 0 #1A1815, 0 0 0 1px #1A1815',
      },
      letterSpacing: {
        label: '0.22em',
      },
    },
  },
  plugins: [],
}
