// @ts-check

module.exports = {
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
      // No greys, white or black, and none of the old neon blue, cyan, pink
      // or yellow: what was grey is the theme's colours made see-through
      // (styles/globals.css).
      // The site's theme (theme/head.json): the head's colours as rendered,
      // from its brightest point (the whitest of its eyes and its skin's
      // reflections) through the colours its light falls off through, to its
      // darkest skin. Light and dark are each the text colour on the other.
      head: require('./theme/head.json'),
      // The forms' messages, in the text colour of the glass card they are on
      // (styles/globals.css): their words tell an error from success.
      status: {
        error: 'var(--card-ink)',
        success: 'var(--card-ink)',
      },
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
};
