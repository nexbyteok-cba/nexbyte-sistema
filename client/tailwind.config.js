/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexblack: {
          DEFAULT: '#05080E',
          pure: '#000000',
          surface: '#06101D',
          card: '#071629',
          cardHover: '#0C203B',
          border: '#122C4D',
          borderLight: '#1B3F6C',
        },
        nexcyan: {
          DEFAULT: '#10DDF2',
          hover: '#3AE5F6',
          active: '#0BC8DC',
          dark: '#084C55',
          glow: 'rgba(16, 221, 242, 0.25)',
        },
        nexblue: {
          DEFAULT: '#087BFF',
          hover: '#298EFF',
          active: '#006CEB',
          dark: '#053D7F',
          glow: 'rgba(8, 123, 255, 0.25)',
        },
        nexwhite: '#F4F7FC',
        nexgray: {
          DEFAULT: '#8FA0B8',
          light: '#CBD5E1',
          dark: '#475569',
          subtle: '#1E293B',
        }
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'lumia': '0 4px 20px -2px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(16, 221, 242, 0.1)',
        'lumia-accent': '0 0 25px -4px rgba(16, 221, 242, 0.45)',
        'lumia-blue': '0 0 25px -4px rgba(8, 123, 255, 0.45)',
      }
    },
  },
  plugins: [],
}
