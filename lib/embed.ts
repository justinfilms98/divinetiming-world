/**
 * Embed URL/ID normalization for hero slots (YouTube, Vimeo).
 * Used by admin (validation) and content layer (resolving).
 * Accepts: YouTube watch, youtu.be, youtube.com/embed/ID, raw 11-char ID.
 * Accepts: Vimeo vimeo.com/ID, vimeo.com/video/ID, player.vimeo.com/video/ID, raw numeric ID.
 */

// YouTube: watch?v=ID | youtu.be/ID | youtube.com/embed/ID | raw 11-char ID
const YOUTUBE_ID_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)?([a-zA-Z0-9_-]{11})$/;
// Vimeo: vimeo.com/ID | vimeo.com/video/ID | player.vimeo.com/video/ID | raw digits
const VIMEO_ID_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:\/|$)/;

export type EmbedProvider = 'youtube' | 'vimeo';

export interface NormalizedEmbed {
  provider: EmbedProvider;
  id: string;
  embed_url: string;
}

function parseYouTubeId(source: string): string | null {
  const t = source.trim();
  if (t.length === 11 && /^[a-zA-Z0-9_-]+$/.test(t)) return t;
  const m = t.match(YOUTUBE_ID_REGEX);
  return m ? m[1]! : null;
}

function parseVimeoId(source: string): string | null {
  const t = source.trim();
  if (/^\d+$/.test(t)) return t;
  const m = t.match(VIMEO_ID_REGEX);
  return m ? m[1]! : null;
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
