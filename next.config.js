/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['facehash'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
