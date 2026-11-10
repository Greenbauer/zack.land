// @ts-check

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
