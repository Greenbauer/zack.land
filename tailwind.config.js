// @ts-check

// The site's easings, the distance off the window where cards and tiles wait,
// and a post's card timings (theme/motion.json): shared with the code that
// animates (Post.tsx, PageLeave.tsx, useMoreMotion.ts, paging.ts) and, as
// custom properties, with styles/globals.css.
const motion = require('./theme/motion.json');

// Seconds, as CSS writes them, from milliseconds.
/** @param {number} ms */
const seconds = (ms) => `${ms / 1000}s`;

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
      transitionTimingFunction: motion.ease,
      transitionDuration: {
        'card-leave': seconds(motion.cardMs.leave),
        'card-wait': seconds(motion.cardMs.wait),
        'card-arrive': seconds(motion.cardMs.arrive),
      },
      translate: { 'off-window': motion.offWindow },
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
        // window's left side (offWindow), slowing gently to a stop, its glass
        // whole all the way, as a post's card does (Post.tsx).
        'card-in': {
          '0%': { translate: `calc(-1 * ${motion.offWindow}) 0` },
          '100%': { translate: '0 0' },
        },
        // The footer's scroll arrow, after its text has faded out
        // (Footer/arrowSwap.ts); and what is on a card arriving (content-in).
        'fade-in': {
          '0%': { opacity: '0' },
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
        'menu-out': {
          '0%': { translate: '0 0', opacity: '1' },
          '100%': { translate: '0 -4rem', opacity: '0' },
        },
      },
      animation: {
        'arrow-l': 'arrow-l 2.5s ease-in-out infinite',
        'card-in': `card-in ${seconds(motion.cardMs.arrive)} ${motion.ease.arrive} both`,
        'fade-in': 'fade-in 0.4s ease-out both',
        // What is on a card arriving fades in with it, slowly and evenly from
        // the start of the card's slide, for as long as it lasts.
        'content-in': `fade-in ${seconds(motion.cardMs.arrive)} linear both`,
        'from-right': `from-right 1.4s ${motion.ease.arrive} both`,
        'menu-in': `menu-in 0.8s ${motion.ease.arrive} both`,
        'menu-out': 'menu-out 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
