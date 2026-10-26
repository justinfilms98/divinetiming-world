import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '110mb',
    },
  },
  async redirects() {
    // Production only: previews must stay reachable on their own *.vercel.app host.
    // /api/* is excluded so webhooks and callbacks are never redirected.
    const canonicalHostRedirects =
      process.env.VERCEL_ENV === 'production'
        ? [
            {
              source: '/:path((?!api/).*)',
              has: [{ type: 'host' as const, value: 'www.divinetiming.world' }],
              destination: 'https://divinetiming.world/:path',
              permanent: true,
            },
            {
              source: '/:path((?!api/).*)',
              has: [{ type: 'host' as const, value: '(?<deployment>.+)\\.vercel\\.app' }],
              destination: 'https://divinetiming.world/:path',
              permanent: false,
            },
          ]
        : [];
    return [
      ...canonicalHostRedirects,
      { source: '/tour', destination: '/events', permanent: true },
      { source: '/epk', destination: '/presskit', permanent: true },
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
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
