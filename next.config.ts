import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/tour', destination: '/events', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ucarecdn.com', pathname: '/**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
