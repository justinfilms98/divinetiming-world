import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

/** Journey blocks CRUD (admin only). Mirrors gallery-media patterns. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { data, error } = await supabase
    .from('journey_blocks')
    .select('*, external_image_asset:external_media_assets(id, preview_url)')
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Admin journey-blocks GET error:', error);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
  return NextResponse.json({ blocks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { id, title, body: bodyText, image_url, external_image_asset_id, align, display_order } = body;

    if (id) {
      const { data, error } = await supabase
        .from('journey_blocks')
        .update({
          title: title ?? null,
          body: bodyText ?? null,
          image_url: image_url ?? null,
          external_image_asset_id: external_image_asset_id ?? null,
          align: align ?? 'left',
          display_order: display_order ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Admin journey-blocks PUT error:', error);
        return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
      }
      revalidatePath('/journey');
      return NextResponse.json({ block: data });
    }

    const { data: maxOrder } = await supabase
      .from('journey_blocks')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    const order = display_order ?? (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('journey_blocks')
      .insert({
        title: title ?? null,
        body: bodyText ?? null,
        image_url: image_url ?? null,
        external_image_asset_id: external_image_asset_id ?? null,
        align: align ?? 'left',
        display_order: order,
      })
      .select()
      .single();
    if (error) {
      console.error('Admin journey-blocks POST error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/journey');
    return NextResponse.json({ block: data });
  } catch (err) {
    console.error('Admin journey-blocks POST error:', err);
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
        .from('journey_blocks')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }
    revalidatePath('/journey');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin journey-blocks PATCH error:', err);
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
    const { error } = await supabase.from('journey_blocks').delete().eq('id', id);
    if (error) {
      console.error('Admin journey-blocks DELETE error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/journey');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin journey-blocks DELETE error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
