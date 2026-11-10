/** Client- and server-safe helpers for deciding how a media URL may be displayed. */

/**
 * Hosts the Next.js image optimizer may fetch from. Must match `images.remotePatterns` in
 * next.config.ts (a test checks this).
 */
export const OPTIMIZABLE_IMAGE_HOSTS = [
  'ucarecdn.com',
  'ucarecdn.net',
  'drive.google.com',
  'lh3.googleusercontent.com',
  '**.supabase.co',
  'i.ytimg.com',
  'img.youtube.com',
] as const;

function hostMatches(pattern: string, host: string): boolean {
  if (pattern.startsWith('**.')) return host.endsWith(pattern.slice(2));
  return host === pattern;
}

/** Whether next/image can resize this URL (https, allowed host). data:, blob: and others cannot. */
export function canOptimizeImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && OPTIMIZABLE_IMAGE_HOSTS.some((p) => hostMatches(p, u.hostname));
  } catch {
    return false;
  }
}

const VIDEO_EXT = /\.(mp4|m4v|mov|webm|ogv)(\?|#|$)/i;

/** True for video files, by MIME type or extension, so they are never loaded as an <img>. */
export function isVideoUrl(url: string | null | undefined, mimeType?: string | null): boolean {
  if ((mimeType || '').toLowerCase().startsWith('video/')) return true;
  return !!url && VIDEO_EXT.test(url);
}
