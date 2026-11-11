import type { NextConfig } from "next";

// Staging branch only: refuse to build unless it points at the isolated staging database,
// so this branch can never produce a preview connected to production data.
const STAGING_SUPABASE_REF = 'goapnjajsjslxbjqthyo';
if (
  process.env.VERCEL_GIT_COMMIT_REF === 'staging/d2a' &&
  !(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes(STAGING_SUPABASE_REF)
) {
  throw new Error(
    `staging/d2a must be built with the staging Supabase project (${STAGING_SUPABASE_REF}). ` +
      'Add the branch-scoped Preview environment variables in Vercel, then redeploy.'
  );
}

const nextConfig: NextConfig = {
  // Staging branch only: the public Journal is switched on here for review; main keeps it off.
  env: { NEXT_PUBLIC_JOURNAL_PUBLIC_ENABLED: '1' },
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
    // Keep optimized copies for 31 days, so large originals are fetched from storage about once a
    // month per region instead of whenever their short storage cache headers expire. Safe because
    // media URLs are never overwritten: every upload gets a new timestamped or content-hashed path.
    minimumCacheTTL: 2678400,
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
