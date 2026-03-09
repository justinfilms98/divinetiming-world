import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { id, name, description, cover_image_url, cover_external_asset_id, cover_url, display_order, clear_cover } = body;

    if (id) {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (name != null) updates.name = name;
      if (description != null) updates.description = description;
      if (clear_cover === true) {
        updates.cover_image_url = null;
        updates.external_cover_asset_id = null;
      } else {
        if (cover_image_url != null) updates.cover_image_url = cover_image_url;
        if (cover_external_asset_id != null) updates.external_cover_asset_id = cover_external_asset_id;
        if (cover_url != null) updates.cover_image_url = cover_url;
      }
      if (display_order != null) updates.display_order = display_order;

      const { data, error } = await supabase
        .from('galleries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Admin galleries update error:', error);
        return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
      }
      revalidatePath('/media');
      return NextResponse.json({ gallery: data });
    }

    const slug = slugify(name || 'gallery') || `gallery-${Date.now()}`;
    const { data: existing } = await supabase.from('galleries').select('id').eq('slug', slug).maybeSingle();
    const finalSlug = existing ? `${slug}-${Date.now().toString(36).slice(-6)}` : slug;

    const { data, error } = await supabase
      .from('galleries')
      .insert({
        name,
        slug: finalSlug,
        description: description ?? null,
        cover_image_url: cover_url ?? cover_image_url ?? null,
        external_cover_asset_id: cover_external_asset_id ?? null,
        display_order: display_order ?? 0,
      })
      .select()
      .single();
    if (error) {
      console.error('Admin galleries insert error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ gallery: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin galleries POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { swap } = body as { swap?: [{ id: string; display_order: number }, { id: string; display_order: number }] };
    if (!Array.isArray(swap) || swap.length !== 2) {
      return NextResponse.json({ error: 'swap array with 2 items required' }, { status: 400 });
    }
    const [a, b] = swap;
    await supabase.from('galleries').update({ display_order: b.display_order, updated_at: new Date().toISOString() }).eq('id', a.id);
    await supabase.from('galleries').update({ display_order: a.display_order, updated_at: new Date().toISOString() }).eq('id', b.id);
    revalidatePath('/media');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin galleries PATCH error:', err);
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
    const { error } = await supabase.from('galleries').delete().eq('id', id);
    if (error) {
      console.error('Admin galleries DELETE error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin galleries DELETE error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
