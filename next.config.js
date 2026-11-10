// @ts-check

// Where a page may load each kind of resource from. Every page is static, so
// Next's inline scripts cannot carry a per-request nonce and scripts keep
// 'unsafe-inline': the policy does not stop an injected inline script. What it
// limits is framing, <base>, plugins, and where a script, frame or request may
// come from or go to.
//
// A host with no scheme ("www.youtube.com") matches only https on the https
// site. On a plain-http server (next start in CI) it also matches http, which
// the YouTube player asks for there.
const sources = {
  'default-src': ["'self'"],
  // reCAPTCHA on /contact, with the sources its FAQ lists for a policy
  // (developers.google.com/recaptcha/docs/faq), here and in connect-src and
  // frame-src; and the YouTube player a post's Play button loads.
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    'https://www.google.com/recaptcha/',
    'https://www.gstatic.com/recaptcha/',
    'www.youtube.com',
  ],
  // The page frame's sizes (PageScroller) and React's style attributes.
  'style-src': ["'self'", "'unsafe-inline'"],
  // data: the lens images the glass builds into SVG filters
  // (Background/photoLens.ts). YouTube thumbnails come through /_next/image.
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'media-src': ["'self'"],
  'connect-src': ["'self'", 'https://www.google.com/recaptcha/'],
  // blob: the worker that times a test draw (Background/quality.ts).
  'worker-src': ["'self'", 'blob:'],
  'frame-src': [
    'www.youtube.com',
    'https://www.google.com/recaptcha/',
    'https://recaptcha.google.com/recaptcha/',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  // X-Frame-Options' twin, below.
  'frame-ancestors': ["'self'"],
};

// next dev evaluates the code it serves, and @vercel/analytics loads its debug
// script from Vercel there.
if (process.env.NODE_ENV !== 'production') {
  sources['script-src'].push("'unsafe-eval'", 'https://va.vercel-scripts.com');
}

// Vercel's toolbar, which preview deployments load, with the sources Vercel
// lists for a policy (vercel.com/docs/vercel-toolbar/managing-toolbar).
// VERCEL_ENV is set at build on Vercel, where headers() is read.
if (process.env.VERCEL_ENV === 'preview') {
  sources['script-src'].push('https://vercel.live');
  sources['style-src'].push('https://vercel.live');
  sources['img-src'].push('https://vercel.live', 'https://vercel.com', 'blob:');
  sources['font-src'].push('https://vercel.live', 'https://assets.vercel.com');
  sources['connect-src'].push('https://vercel.live', 'wss://ws-us3.pusher.com');
  sources['frame-src'].push('https://vercel.live');
}

const contentSecurityPolicy = Object.entries(sources)
  .map(([directive, list]) => [directive, ...list].join(' '))
  .join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // SAMEORIGIN, not DENY: the QA explorer frames a page from the site's own
  // /robots.txt to sample it while it loads (.github/workflows/qae-explore.yml).
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Only what the site never uses. Autoplay, fullscreen and the motion
  // sensors are left alone: the YouTube player needs them.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
];

/**
 * @type {import('next').NextConfig}
 **/
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // A YouTube video's thumbnail, served from this site, so it can be drawn
    // (components/MediaBend.tsx).
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
