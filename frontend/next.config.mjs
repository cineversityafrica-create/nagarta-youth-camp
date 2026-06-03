/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  // Allow all popups, modals, and interactive features in development
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        // Allow popups and modals
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin-allow-popups',
        },
        // Allow all interactive content
        {
          key: 'Permissions-Policy',
          value: 'geolocation=*, microphone=*, camera=*, payment=*',
        },
      ],
    },
  ],
  // Disable security warnings in development
  swcMinify: true,
  reactStrictMode: false, // Disable strict mode to prevent double-renders
};

export default nextConfig;
