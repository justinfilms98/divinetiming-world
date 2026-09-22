/**
 * YouTube adapter — pure, side-effect-free helpers (no network, no googleapis).
 * Unit-tested in __tests__/youtubeNormalize.test.ts.
 */

export interface NormalizedVideo {
  /** YouTube video id (11 chars). Used as content_sources.external_content_id. */
  externalId: string;
  title: string;
  description: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  sourceUrl: string;
}

export interface ChannelInput {
  channelId?: string;
  handle?: string;
}

export function youtubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Minimal shape of a YouTube API playlistItem (only fields we read). */
export interface RawPlaylistItem {
  snippet?: {
    title?: string | null;
    description?: string | null;
    publishedAt?: string | null;
    resourceId?: { videoId?: string | null } | null;
    thumbnails?: Record<string, { url?: string | null } | undefined> | null;
  } | null;
  contentDetails?: { videoId?: string | null; videoPublishedAt?: string | null } | null;
}

/** Map a raw playlistItem to a NormalizedVideo, or null if it has no video id. */
export function mapPlaylistItem(item: RawPlaylistItem | null | undefined): NormalizedVideo | null {
  if (!item) return null;
  const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
  if (!videoId) return null;
  const sn = item.snippet ?? {};
  const thumbs = sn.thumbnails ?? {};
  const thumbnailUrl =
    thumbs.maxres?.url ||
    thumbs.standard?.url ||
    thumbs.high?.url ||
    thumbs.medium?.url ||
    thumbs.default?.url ||
    null;
  const publishedAt = item.contentDetails?.videoPublishedAt || sn.publishedAt || null;
  return {
    externalId: videoId,
    title: (sn.title ?? '').trim() || 'Untitled',
    description: sn.description ?? '',
    publishedAt,
    thumbnailUrl,
    sourceUrl: youtubeVideoUrl(videoId),
  };
}

/**
 * Parse a channel identifier from a channel id, @handle, or channel/handle URL.
 * Returns null when the input is not a recognizable YouTube channel reference.
 */
export function parseChannelInput(input: unknown): ChannelInput | null {
  if (typeof input !== 'string') return null;
  const t = input.trim();
  if (!t) return null;

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(t)) return { channelId: t };
  if (/^@[a-zA-Z0-9._-]+$/.test(t)) return { handle: t.slice(1) };

  try {
    const u = new URL(t);
    const host = u.hostname.toLowerCase();
    if (host !== 'youtube.com' && !host.endsWith('.youtube.com')) return null;
    const chan = u.pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (chan) return { channelId: chan[1]! };
    const handle = u.pathname.match(/\/@([a-zA-Z0-9._-]+)/);
    if (handle) return { handle: handle[1]! };
    return null;
  } catch {
    return null;
  }
}

/**
 * Incremental filter: keep videos strictly newer than the checkpoint (an ISO
 * timestamp of the last processed video). No checkpoint => keep everything.
 */
export function isNewerThanCheckpoint(publishedAt: string | null, checkpoint: string | null): boolean {
  if (!checkpoint) return true;
  if (!publishedAt) return false;
  const p = Date.parse(publishedAt);
  const c = Date.parse(checkpoint);
  if (Number.isNaN(p) || Number.isNaN(c)) return true;
  return p > c;
}

/** Newest publishedAt among videos, for advancing the checkpoint. */
export function maxPublishedAt(videos: NormalizedVideo[], current: string | null): string | null {
  let best = current;
  let bestMs = current ? Date.parse(current) : Number.NEGATIVE_INFINITY;
  for (const v of videos) {
    if (!v.publishedAt) continue;
    const ms = Date.parse(v.publishedAt);
    if (!Number.isNaN(ms) && ms > bestMs) {
      bestMs = ms;
      best = v.publishedAt;
    }
  }
  return best;
}
