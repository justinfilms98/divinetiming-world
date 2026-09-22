/**
 * Instagram adapter — pure, side-effect-free helpers (no network, no Meta SDK).
 *
 * Phase 3 groundwork: the direct Meta Graph API connector requires a Meta app,
 * a Business/Creator account, and OAuth, so it is deferred. These helpers power
 * the compliant MANUAL-IMPORT fallback (spec §7): an admin pastes an Instagram
 * URL and we derive a stable identity (the shortcode) for idempotency.
 */

import type { SourceType } from '../types';

/** Extract the shortcode from an Instagram post/reel/tv URL, or null. */
export function parseInstagramShortcode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const t = input.trim();
  if (!t) return null;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (host !== 'instagram.com' && !host.endsWith('.instagram.com')) return null;
  const m = u.pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1]! : null;
}

/** Classify the Instagram content kind from its URL. */
export function instagramSourceType(input: unknown): SourceType | null {
  if (typeof input !== 'string') return null;
  const t = input.trim().toLowerCase();
  if (!parseInstagramShortcode(t)) return null;
  if (t.includes('/reel/') || t.includes('/reels/')) return 'reel';
  if (t.includes('/tv/')) return 'video';
  if (t.includes('/p/')) return 'post';
  return 'post';
}

/** True if the URL points at instagram.com content we can identify. */
export function isInstagramUrl(input: unknown): boolean {
  return parseInstagramShortcode(input) !== null;
}
