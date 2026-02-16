import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { id, title, youtube_id, thumbnail_url, is_featured, display_order } = body;

    if (id) {
      const { data, error } = await supabase
        .from('videos')
        .update({
          title: title ?? undefined,
          youtube_id: youtube_id ?? undefined,
          thumbnail_url: thumbnail_url ?? undefined,
          is_featured: is_featured ?? undefined,
          display_order: display_order ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Admin videos update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      revalidatePath('/media');
      return NextResponse.json({ video: data });
    }

    const { data: maxOrder } = await supabase
      .from('videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const order = display_order ?? (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('videos')
      .insert({
        title: title ?? '',
        youtube_id: youtube_id ?? '',
        thumbnail_url: thumbnail_url ?? null,
        is_featured: is_featured ?? false,
        display_order: order,
      })
      .select()
      .single();
    if (error) {
      console.error('Admin videos insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ video: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin videos POST error:', err);
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
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) {
      console.error('Admin videos DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin videos DELETE error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
