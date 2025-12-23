/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Per Docker
  images: {
    domains: ['localhost'],
    unoptimized: true, // Per Docker
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Per upload foto
    },
  },
}

module.exports = nextConfig

