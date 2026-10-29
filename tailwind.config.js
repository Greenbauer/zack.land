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
        // The contact card arriving: it slides in from wholly off the
        // window's left side (its glass reaches 15rem past the right edge, so
        // a window's width and 20rem) over 1.4 seconds, slowing gently to a
        // stop, its glass whole all the way, as a post's card does (Post.tsx);
        // the form on it fades in alongside (content-in).
        'card-in': {
          '0%': { translate: 'calc(-100vw - 20rem) 0' },
          '100%': { translate: '0 0' },
        },
        // What is on a card arriving: it starts fading in a fifth of the way
        // through the card's slide (card-in, the same length).
        // The footer's scroll arrow, after its text has faded out
        // (Footer/arrowSwap.ts).
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'content-in': {
          '0%': { opacity: '0' },
          '20%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // The home page's title arriving: it slides in from wholly off the
        // window's right side, slowing gently to a stop (app/(root)/page.tsx).
        'from-right': {
          '0%': { translate: 'calc(100vw + 4rem) 0' },
          '100%': { translate: '0 0' },
        },
        // The phone menu arriving: the same, sliding down from above.
        'menu-in': {
          '0%': { translate: '0 -100dvh', opacity: '0' },
          '20%': { opacity: '0' },
          '100%': { translate: '0 0', opacity: '1' },
        },
      },
      animation: {
        'arrow-l': 'arrow-l 2.5s ease-in-out infinite',
        'card-in': 'card-in 1.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'content-in': 'content-in 1.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'from-right': 'from-right 1.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'menu-in': 'menu-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
