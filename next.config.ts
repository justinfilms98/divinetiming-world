import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/tour', destination: '/events', permanent: true },
    ];
  },
  // Direct CDN only. No /image proxy. Uploadcare + Drive for legacy.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ucarecdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ucarecdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'drive.google.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
