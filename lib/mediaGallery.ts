/**
 * Resolve gallery cover, gallery media, and video thumbnail URLs for public display.
 * Use server-side only; attach resolved fields in getGalleriesWithMedia / getGalleryBySlug / getVideos.
 * Server-only: imports resolveMediaUrl which uses lib/supabase/server.
 */

import 'server-only';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';

function isValidHttpsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.trim().startsWith('https://');
}

export type GalleryRow = {
  cover_image_url?: string | null;
  external_cover_asset_id?: string | null;
};

/**
 * Resolves the display URL for a gallery's cover image.
 * Order: cover_image_url (https) → external_cover_asset_id.
 */
export async function resolveGalleryCoverUrl(gallery: GalleryRow): Promise<string | null> {
  if (isValidHttpsUrl(gallery.cover_image_url)) return gallery.cover_image_url!.trim();
  if (gallery.external_cover_asset_id) {
    const resolved = await resolveMediaUrl(null, gallery.external_cover_asset_id);
    if (resolved?.thumbnailUrl) return resolved.thumbnailUrl;
    if (resolved?.url) return resolved.url;
  }
  return null;
}

export type GalleryMediaRow = {
  url?: string | null;
  thumbnail_url?: string | null;
  external_media_asset_id?: string | null;
};

/**
 * Resolves display URL and thumbnail for a gallery media item.
 */
export async function resolveGalleryMediaUrl(item: GalleryMediaRow): Promise<{ url: string | null; thumbnailUrl: string | null }> {
  if (item.external_media_asset_id) {
    const resolved = await resolveMediaUrl(null, item.external_media_asset_id);
    if (resolved)
      return { url: resolved.url, thumbnailUrl: resolved.thumbnailUrl ?? resolved.url };
  }
  const url = isValidHttpsUrl(item.url) ? item.url!.trim() : null;
  const thumbnailUrl = isValidHttpsUrl(item.thumbnail_url) ? item.thumbnail_url!.trim() : (url ?? null);
  return { url, thumbnailUrl };
}

export type VideoRow = { youtube_id: string; thumbnail_url?: string | null };

const YOUTUBE_THUMB = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

/**
 * Resolves thumbnail URL for a video card. Sync: admin thumbnail_url (https) or YouTube default.
 */
export function resolveVideoThumbnailUrl(video: VideoRow): string {
  if (isValidHttpsUrl(video.thumbnail_url)) return video.thumbnail_url!.trim();
  return YOUTUBE_THUMB(video.youtube_id);
}
