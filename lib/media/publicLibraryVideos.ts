import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { MediaPageVideo } from '@/lib/content/shared';
import { selectLibraryVideos, type LibraryVideoRow } from '@/lib/media/libraryVideoSelection';

/**
 * Public Media → Videos tab: Supabase library videos that are not archived, tagged for
 * public use, and not homepage hero footage (including re-uploads of the same hero file).
 */
export async function getPublicLibraryVideoAssets(): Promise<MediaPageVideo[]> {
  const supabase = await createClient();
  const [{ data, error }, { data: heroes }] = await Promise.all([
    supabase
      .from('external_media_assets')
      .select('id, name, preview_url, thumbnail_url, mime_type, orientation, alt_text')
      .eq('provider', 'supabase')
      .eq('is_archived', false)
      .eq('usage_type', 'public')
      .order('created_at', { ascending: false }),
    supabase.from('hero_sections').select('media_url, media_storage_path, external_media_asset_id, hero_slots'),
  ]);

  if (error) return [];
  return selectLibraryVideos((data || []) as LibraryVideoRow[], heroes ?? []);
}
