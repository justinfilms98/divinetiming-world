/**
 * Defense-in-depth: refuse abandon-uploads for any path still referenced by
 * content tables, not only external_media_assets.
 */

import { mediaUrlPointsAtPath } from '@/lib/media/abandonUploads';

/** Loose client shape so Supabase generics do not explode at the call site. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MediaReferenceClient = { from: (table: string) => any };

/** Exact storage-path columns (no URL prefix). */
const PATH_COLUMNS: Array<{ table: string; column: string }> = [
  { table: 'external_media_assets', column: 'file_id' },
  { table: 'hero_sections', column: 'media_storage_path' },
  { table: 'hero_sections', column: 'hero_logo_storage_path' },
];

/** URL columns that may embed /storage/v1/object/public/media/<path>. */
const URL_COLUMNS: Array<{ table: string; columns: string[] }> = [
  { table: 'external_media_assets', columns: ['preview_url', 'thumbnail_url', 'cdn_url'] },
  { table: 'hero_sections', columns: ['media_url', 'hero_logo_url'] },
  { table: 'journal_episodes', columns: ['cover_image_url'] },
  { table: 'events', columns: ['thumbnail_url', 'gallery_url', 'recap_video_url'] },
  { table: 'event_media', columns: ['url', 'thumbnail_url'] },
  { table: 'galleries', columns: ['cover_image_url'] },
  { table: 'gallery_media', columns: ['url', 'thumbnail_url'] },
  { table: 'journey_blocks', columns: ['image_url'] },
  { table: 'product_images', columns: ['image_url'] },
  { table: 'products', columns: ['thumbnail_url'] },
  { table: 'releases', columns: ['cover_image_url', 'video_url'] },
  { table: 'about_photos', columns: ['image_url'] },
  { table: 'media_carousel_slides', columns: ['url', 'thumbnail_url'] },
  { table: 'site_settings', columns: ['hero_media_url'] },
  { table: 'booking_content', columns: ['image_url'] },
  { table: 'page_settings', columns: ['booking_about_image_url'] },
  { table: 'photos', columns: ['image_url', 'thumbnail_url'] },
  { table: 'photo_albums', columns: ['cover_image_url'] },
  { table: 'presskit_assets', columns: ['url'] },
  { table: 'videos', columns: ['thumbnail_url'] },
];

function asRows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

/**
 * Returns the subset of `paths` that appear in the media library or any known
 * content reference (storage path or public media URL).
 */
export async function findReferencedMediaPaths(
  supabase: MediaReferenceClient,
  paths: string[]
): Promise<Set<string>> {
  const referenced = new Set<string>();
  if (!paths.length) return referenced;

  for (const { table, column } of PATH_COLUMNS) {
    const { data, error } = await supabase.from(table).select(column).in(column, paths);
    if (error) {
      console.error(`mediaReferenceGuard ${table}.${column} error:`, error);
      throw new Error('reference_lookup_failed');
    }
    for (const row of asRows(data)) {
      const value = row[column];
      if (typeof value === 'string' && paths.includes(value)) referenced.add(value);
    }
  }

  for (const path of paths) {
    if (referenced.has(path)) continue;
    for (const { table, columns } of URL_COLUMNS) {
      const orExpr = columns.map((c) => `${c}.ilike.%${path}%`).join(',');
      const { data, error } = await supabase.from(table).select(columns.join(',')).or(orExpr).limit(20);
      if (error) {
        console.error(`mediaReferenceGuard ${table} url error:`, error);
        throw new Error('reference_lookup_failed');
      }
      for (const row of asRows(data)) {
        for (const col of columns) {
          const value = row[col];
          if (typeof value === 'string' && mediaUrlPointsAtPath(value, path)) {
            referenced.add(path);
            break;
          }
        }
        if (referenced.has(path)) break;
      }
      if (referenced.has(path)) break;
    }
  }

  return referenced;
}
