import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const page_slug = body?.page_slug;
    if (!page_slug || typeof page_slug !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid page_slug' }, { status: 400 });
    }

    const slug = page_slug.trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: 'Invalid page_slug' }, { status: 400 });

    const { data: existing } = await supabase
      .from('hero_sections')
      .select('id')
      .eq('page_slug', slug)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Hero section not found for this page' }, { status: 404 });
    }

    // Null legacy hero URL fields only (columns must exist: 009, 021, 023, 013/014). Idempotent.
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
      console.error('Hero purge-legacy error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Purge failed';
    console.error('Hero purge-legacy error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
