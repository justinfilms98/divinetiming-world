/**
 * Hosts that next/image may optimise (must stay in sync with images.remotePatterns in
 * next.config.ts). Originals in Supabase Storage can be 30MB+; serving them raw on mobile
 * is the single biggest cause of slow or "empty" image areas.
 * Google Drive is excluded: its share URLs redirect to HTML, which the optimiser rejects.
 */
const OPTIMIZABLE_HOST_SUFFIXES = ['.supabase.co', 'ucarecdn.com', 'ucarecdn.net', 'i.ytimg.com', 'img.youtube.com', 'lh3.googleusercontent.com'];

export function isOptimizableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const host = new URL(url).hostname;
    return OPTIMIZABLE_HOST_SUFFIXES.some((suffix) => host === suffix.replace(/^\./, '') || host.endsWith(suffix));
  } catch {
    return false;
  }
}
