// @ts-check

// `next dev` evaluates the code it serves, which a production build never does.
const devScripts =
  process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";

// Everything the pages load, by where it comes from. The pages are
// prerendered, so Next's inline scripts cannot carry a per-request nonce and
// 'unsafe-inline' stays: the policy does not stop an injected inline script.
// What it limits is who may frame the site, where a script, frame or request
// may come from or go to, plugins, and <base>.
const contentSecurityPolicy = [
  "default-src 'self'",
  // Google: reCAPTCHA on /contact, with the sources its FAQ lists for a
  // policy (developers.google.com/recaptcha/docs/faq), here and in
  // connect-src and frame-src. YouTube: the player a post's Play button loads.
  `script-src 'self' 'unsafe-inline'${devScripts} https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.youtube.com`,
  // Inline: the page frame's sizes (PageScroller) and React's style attributes.
  "style-src 'self' 'unsafe-inline'",
  // data: the lens images built into SVG filters (Background/photoLens.ts).
  // YouTube thumbnails come through /_next/image, so they are 'self'.
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self' https://www.google.com/recaptcha/",
  // blob: the worker that times a test draw (Background/quality.ts).
  "worker-src 'self' blob:",
  'frame-src https://www.youtube.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

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
  // Report-Only: a browser logs what the policy would block and blocks
  // nothing. It becomes Content-Security-Policy once a walk of the deployed
  // site (every page, a YouTube post played, the form sent) logs nothing.
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
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
