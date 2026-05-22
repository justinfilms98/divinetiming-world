import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '110mb',
    },
  },
  async redirects() {
    return [
      { source: '/tour', destination: '/events', permanent: true },
      { source: '/epk', destination: '/presskit', permanent: true },
      { source: '/booking', destination: '/contact', permanent: true },
      { source: '/admin/booking', destination: '/admin/journey', permanent: false },
    ];
  },
  // Direct CDN only. No /image proxy. Uploadcare + Drive for legacy; Supabase Storage for hero media.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ucarecdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ucarecdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'drive.google.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/**' },
    ],
  },
};

export default nextConfig;
