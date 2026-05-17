/**
 * Hero media: Supabase Storage URL resolution.
 * Re-exports from storageUrls (bucket: media). Legacy callers can keep importing here.
 */

export {
  supabasePublicObjectUrl,
  resolveHeroMediaUrl,
  resolveHeroLogoUrl,
  MEDIA_BUCKET,
} from '@/lib/storageUrls';

export interface HeroRow {
  media_url?: string | null;
  media_storage_path?: string | null;
  hero_logo_url?: string | null;
  hero_logo_storage_path?: string | null;
}
