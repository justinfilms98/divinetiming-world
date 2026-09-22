import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { MediaPageVideo } from '@/lib/content/shared';

/**
 * Public Media → Videos tab: Supabase library videos that are not archived
 * and tagged for public use. Empty result is expected when the library is
 * unused or everything is internal/archived.
 */
export async function getPublicLibraryVideoAssets(): Promise<MediaPageVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('external_media_assets')
    .select('id, name, preview_url, thumbnail_url, mime_type, orientation')
    .eq('provider', 'supabase')
    .eq('is_archived', false)
    .eq('usage_type', 'public')
    .order('created_at', { ascending: false });

  if (error) return [];
  const rows = (data || []) as {
    id: string;
    name?: string | null;
    preview_url?: string | null;
    thumbnail_url?: string | null;
    mime_type?: string | null;
    orientation?: string | null;
  }[];
  return rows
    .filter((r) => (r.mime_type || '').toLowerCase().startsWith('video/'))
    .map((r) => ({
      id: `lib-${r.id}`,
      title: (r.name || 'Video').trim() || 'Video',
      video_url: (r.preview_url || '').trim() || undefined,
      thumbnail_url: (r.thumbnail_url || r.preview_url || '').trim() || null,
      resolved_thumbnail_url: (r.thumbnail_url || r.preview_url || '').trim() || '',
      caption: null,
      is_vertical: r.orientation === 'portrait',
    }));
}
