import { type Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      sans: ['var(--font-kanit)'],
      display: ['var(--font-roboto)'],
    },
    colors: {
      transparent: 'transparent',
      blue: 'rgb(0 51 128 / 75%)',
      cyan: 'rgb(61 225 255 / 75%)',
      pink: 'rgb(255 49 175 / 75%)',
      yellow: 'rgb(255 210 101 / 75%)',
      white: '#dddddd',
      gray: {
        lightest: '#999999',
        light: '#777777',
        DEFAULT: '#333333',
        dark: '#222222',
        darkest: '#171717',
      },
      black: '#111111',
    },
    extend: {
      keyframes: {
        'arrow-l': {
          '0%': {
            opacity: '0',
          },
          '70%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
            left: '-40px',
          },
        },
      },
      animation: {
        'arrow-l': 'arrow-l 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
