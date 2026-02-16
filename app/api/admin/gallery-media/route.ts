import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { gallery_id, media_type, url, thumbnail_url, caption, external_media_asset_id, display_order } = body;

    if (!gallery_id || !media_type) {
      return NextResponse.json({ error: 'gallery_id and media_type required' }, { status: 400 });
    }

    const displayUrl = url ?? (external_media_asset_id ? null : '');
    const { data: maxOrder } = await supabase
      .from('gallery_media')
      .select('display_order')
      .eq('gallery_id', gallery_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const order = display_order ?? (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('gallery_media')
      .insert({
        gallery_id,
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
      console.error('Admin gallery-media POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ media: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin gallery-media POST error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
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
        .from('gallery_media')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }
    revalidatePath('/media');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin gallery-media PATCH error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
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
    const { error } = await supabase.from('gallery_media').delete().eq('id', id);
    if (error) {
      console.error('Admin gallery-media DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin gallery-media DELETE error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
