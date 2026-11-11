/**
 * Embed URL/ID normalization for hero slots and Journal episodes (YouTube, Vimeo).
 * Used by admin (validation) and content layer (resolving).
 *
 * Links are parsed as URLs, never matched loosely: only http(s), no credentials or ports, an exact
 * host from the allowlist below, and a known path shape. Only the video ID is kept, so share and
 * tracking parameters (?si=, &t=, &feature=) are discarded and nothing else from the link is stored.
 *
 * Accepts: YouTube watch?v=ID, youtu.be/ID, youtube.com/embed/ID, raw 11-char ID.
 * Accepts: Vimeo vimeo.com/ID, vimeo.com/video/ID, player.vimeo.com/video/ID, raw numeric ID.
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com']);
const YOUTU_BE = 'youtu.be';
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com']);
const VIMEO_PLAYER = 'player.vimeo.com';
const MAX_LENGTH = 500;

export type EmbedProvider = 'youtube' | 'vimeo';

export interface NormalizedEmbed {
  provider: EmbedProvider;
  id: string;
  embed_url: string;
}

/** A web link on the open internet, or null. A missing scheme means https. */
function parseLink(input: string): URL | null {
  if (input.length > MAX_LENGTH || /[\s<>"'\\]/.test(input)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password || url.port) return null;
  return url;
}

function pathSegments(url: URL): string[] {
  return url.pathname.split('/').filter(Boolean);
}

function parseYouTubeId(source: string): string | null {
  if (YOUTUBE_ID.test(source)) return source;
  const url = parseLink(source);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  const parts = pathSegments(url);
  let id: string | null = null;
  if (host === YOUTU_BE && parts.length === 1) id = parts[0]!;
  else if (YOUTUBE_HOSTS.has(host)) {
    if (parts.length === 1 && parts[0] === 'watch') id = url.searchParams.getAll('v').length === 1 ? url.searchParams.get('v') : null;
    else if (parts.length === 2 && parts[0] === 'embed') id = parts[1]!;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function parseVimeoId(source: string): string | null {
  if (VIMEO_ID.test(source)) return source;
  const url = parseLink(source);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  const parts = pathSegments(url);
  let id: string | null = null;
  if (VIMEO_HOSTS.has(host)) id = parts[0] === 'video' ? (parts[1] ?? null) : (parts[0] ?? null);
  else if (host === VIMEO_PLAYER && parts[0] === 'video') id = parts[1] ?? null;
  return id && VIMEO_ID.test(id) ? id : null;
}

/**
 * Normalize YouTube or Vimeo URL/ID to provider + id + embed_url.
 * Returns null if input is not a valid YouTube or Vimeo reference.
 */
export function normalizeHeroEmbed(input: string | null | undefined): NormalizedEmbed | null {
  if (input == null || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const youtubeId = parseYouTubeId(trimmed);
  if (youtubeId) {
    return {
      provider: 'youtube',
      id: youtubeId,
      embed_url: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const vimeoId = parseVimeoId(trimmed);
  if (vimeoId) {
    return {
      provider: 'vimeo',
      id: vimeoId,
      embed_url: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  return null;
}
