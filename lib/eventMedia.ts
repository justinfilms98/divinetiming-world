/**
 * Resolve event thumbnail/image URL for public display.
 * Use this everywhere events are rendered (list cards, detail hero).
 * Order: storage path (if present) → legacy thumbnail_url (https) → external_thumbnail_asset_id.
 * Server-only: imports resolveMediaUrl which uses lib/supabase/server.
 */

import 'server-only';
import { supabasePublicObjectUrl } from '@/lib/storageUrls';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';
import type { Event } from '@/lib/types/content';

function isValidHttpsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.trim().startsWith('https://');
}

/**
 * Resolves the display URL for an event's thumbnail.
 * Prefer Supabase storage path, then legacy thumbnail_url (https), then external_thumbnail_asset_id.
 */
export async function resolveEventThumbnailUrl(event: Event): Promise<string | null> {
  const row = event as Event & { thumbnail_storage_path?: string | null };

  if (row.thumbnail_storage_path) {
    const url = supabasePublicObjectUrl(row.thumbnail_storage_path);
    if (url) return url;
  }

  if (isValidHttpsUrl(event.thumbnail_url)) return event.thumbnail_url!.trim();

  if (event.external_thumbnail_asset_id) {
    const resolved = await resolveMediaUrl(null, event.external_thumbnail_asset_id);
    if (resolved?.thumbnailUrl) return resolved.thumbnailUrl;
    if (resolved?.url) return resolved.url;
  }

  return null;
}

/**
 * Attach resolved_thumbnail_url to each event. Use in getEvents / getEventBySlug.
 */
export async function withResolvedThumbnails(events: Event[]): Promise<Event[]> {
  const withUrls = await Promise.all(
    events.map(async (event) => {
      const url = await resolveEventThumbnailUrl(event);
      return { ...event, resolved_thumbnail_url: url };
    })
  );
  return withUrls;
}

/** Re-export for server code that imports from eventMedia. Client should use @/lib/eventDetailHref. */
export { eventDetailHref } from '@/lib/eventDetailHref';
