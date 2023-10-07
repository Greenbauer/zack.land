// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.behance.net',
        port: '',
        pathname: '/projects/**',
      },
    ],
  },
};

module.exports = nextConfig;
