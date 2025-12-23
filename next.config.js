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
  // Disabilita prerendering per pagine dinamiche
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig

