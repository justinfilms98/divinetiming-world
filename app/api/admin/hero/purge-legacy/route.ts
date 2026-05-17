import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { apiError, apiSuccess } from '@/lib/apiResponses';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const page_slug = body?.page_slug;
    if (!page_slug || typeof page_slug !== 'string') {
      return apiError('Missing or invalid page_slug', 400);
    }

    const slug = page_slug.trim().toLowerCase();
    if (!slug) return apiError('Invalid page_slug', 400);

    const { data: existing } = await supabase
      .from('hero_sections')
      .select('id')
      .eq('page_slug', slug)
      .single();

    if (!existing) {
      return apiError('Hero section not found for this page', 404);
    }

    // Null legacy hero URL fields only. Idempotent.
    const { error } = await supabase
      .from('hero_sections')
      .update({
        media_url: null,
        media_storage_path: null,
        hero_logo_url: null,
        hero_logo_storage_path: null,
        external_media_asset_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('[hero/purge-legacy]', error.message);
      return apiError('Purge failed', 500);
    }

    return apiSuccess(undefined);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.error('[hero/purge-legacy]', err);
    return apiError('Purge failed', 500);
  }
}
