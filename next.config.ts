import type { NextConfig } from "next";

// Staging branches only: refuse to build unless the deployment points at the isolated
// staging Supabase project. Prevents a staging preview from silently using production.
const STAGING_SUPABASE_REF = 'goapnjajsjslxbjqthyo';
const PRODUCTION_SUPABASE_REF = 'lokewuvbrrvmlgdwivoa';
const stagingBranch =
  process.env.VERCEL_GIT_COMMIT_REF === 'staging/d2a' ||
  process.env.VERCEL_GIT_COMMIT_REF === 'staging/d3a';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
if (stagingBranch && !supabaseUrl.includes(STAGING_SUPABASE_REF)) {
  throw new Error(
    `${process.env.VERCEL_GIT_COMMIT_REF} must be built with the staging Supabase project (${STAGING_SUPABASE_REF}). ` +
      'Add branch-scoped Preview environment variables in Vercel for this branch, then redeploy. ' +
      'Missing staging config fails closed — it will not fall back to production.'
  );
}
if (stagingBranch && supabaseUrl.includes(PRODUCTION_SUPABASE_REF)) {
  throw new Error(
    `${process.env.VERCEL_GIT_COMMIT_REF} is configured with the production Supabase project. ` +
      'Replace the branch-scoped Preview env vars with staging credentials before deploying.'
  );
}

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
