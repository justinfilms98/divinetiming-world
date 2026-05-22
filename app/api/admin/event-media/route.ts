import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

/**
 * Per-event media CRUD. Mirrors /api/admin/gallery-media but scoped to event_media.
 * GET ?event_id=... → list
 * POST { event_id, media_type, url, thumbnail_url?, caption?, external_media_asset_id? }
 * PATCH { items: [{ id, display_order }] }
 * DELETE ?id=...
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('event_media')
    .select('*, external_media_asset:external_media_assets(id, preview_url, thumbnail_url, mime_type)')
    .eq('event_id', eventId)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Admin event-media GET error:', error);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
  return NextResponse.json({ media: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { event_id, media_type, url, thumbnail_url, caption, external_media_asset_id, display_order } = body;

    if (!event_id || !media_type) {
      return NextResponse.json({ error: 'event_id and media_type required' }, { status: 400 });
    }

    const displayUrl = url ?? (external_media_asset_id ? null : '');
    const { data: maxOrder } = await supabase
      .from('event_media')
      .select('display_order')
      .eq('event_id', event_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const order = display_order ?? (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('event_media')
      .insert({
        event_id,
        media_type,
        url: displayUrl,
        thumbnail_url: thumbnail_url ?? null,
        caption: caption ?? null,
        external_media_asset_id: external_media_asset_id ?? null,
        display_order: order,
      })
      .select()
      .single();
    if (error) {
      console.error('Admin event-media POST error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/events');
    return NextResponse.json({ media: data });
  } catch (err) {
    console.error('Admin event-media POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { items } = body as { items?: { id: string; display_order: number }[] };
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 });
    }
    for (const item of items) {
      await supabase
        .from('event_media')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }
    revalidatePath('/events');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin event-media PATCH error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase.from('event_media').delete().eq('id', id);
    if (error) {
      console.error('Admin event-media DELETE error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/events');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin event-media DELETE error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
