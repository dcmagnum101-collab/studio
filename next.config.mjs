/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Stub out legacy firebase and google maps packages
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/firestore': false,
      'firebase/auth': false,
      'firebase/app': false,
      'firebase/storage': false,
      'firebase/functions': false,
      'firebase-admin': false,
      'papaparse': false,
      '@react-google-maps/api': false,
      '@react-email/components': false,
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
