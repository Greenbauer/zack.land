// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
module.exports = {
  reactStrictMode: true,
  images: {
    // A YouTube video's thumbnail, served from this site, so it can be drawn
    // (components/MediaBend.tsx).
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
};
