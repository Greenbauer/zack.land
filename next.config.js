const withTM = require('next-transpile-modules')(['three'])

/** @type {import('next').NextConfig} */
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
}

const plugins = [withTM];

module.exports = plugins.reduce((acc, next) => next(acc), {
  ...nextConfig,
})
