/**
 * Supabase Storage URL resolution. Standard bucket: media (public).
 * Store only storage paths in DB; compute public URLs here.
 */

export const MEDIA_BUCKET = 'media';

export function supabasePublicObjectUrl(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = path.replace(/^\/+/, '').trim();
  if (!clean) return null;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${MEDIA_BUCKET}/${clean}`;
}

export function resolveHeroMediaUrl(row: {
  media_storage_path?: string | null;
  media_url?: string | null;
}): string | null {
  if (row.media_storage_path) return supabasePublicObjectUrl(row.media_storage_path);
  return row.media_url ?? null;
}

export function resolveHeroLogoUrl(row: {
  hero_logo_storage_path?: string | null;
  hero_logo_url?: string | null;
}): string | null {
  if (row.hero_logo_storage_path) return supabasePublicObjectUrl(row.hero_logo_storage_path);
  return row.hero_logo_url ?? null;
}

/** Resolve hero slot image URL from storage path (Phase 9/9.1). */
export function resolveHeroSlotImageUrl(image_storage_path: string | null | undefined): string | null {
  return supabasePublicObjectUrl(image_storage_path ?? null);
}

/** Resolve hero slot video URL from storage path (Phase 9.1). */
export function resolveHeroSlotVideoUrl(video_storage_path: string | null | undefined): string | null {
  return supabasePublicObjectUrl(video_storage_path ?? null);
}

/** Resolve hero slot poster URL from storage path (Phase 9.1). */
export function resolveHeroSlotPosterUrl(poster_storage_path: string | null | undefined): string | null {
  return supabasePublicObjectUrl(poster_storage_path ?? null);
}
