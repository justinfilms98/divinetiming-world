import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/tour', destination: '/events', permanent: true },
    ];
  },
  // Phase 29A: direct CDN only. No /image proxy. ucarecdn.com + drive for legacy.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ucarecdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'drive.google.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
