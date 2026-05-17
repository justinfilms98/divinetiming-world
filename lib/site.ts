/**
 * Site-wide constants for SEO, metadata, and canonical URLs.
 * Phase 12 — SEO + Metadata + Social Sharing.
 */

export const SITE_NAME = 'Divine Timing';

export const BASE_URL =
  typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' &&
  process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://divinetiming.world';

/** Default OG image path (1200×630 recommended). Place at public/opengraph.png. */
export const DEFAULT_OG_IMAGE = '/opengraph.png';

/** Build canonical URL for a path (e.g. '/events' → 'https://divinetiming.world/events'). */
export function canonicalUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

/** Ensure image URL is absolute for OpenGraph/Twitter. */
export function absoluteImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}
