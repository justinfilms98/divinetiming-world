import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const body = await request.json().catch(() => ({}));
  const kind = body.kind === 'logo' ? 'logo' : 'photo';
  const external_media_asset_id =
    typeof body.external_media_asset_id === 'string' && body.external_media_asset_id.trim()
      ? body.external_media_asset_id.trim()
      : null;
  const url = nullableText(body.url);
  if (!external_media_asset_id && !url) {
    return NextResponse.json({ error: 'Pick a media asset or provide a URL' }, { status: 400 });
  }

  const { data: last } = await supabase
    .from('presskit_assets')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('presskit_assets')
    .insert({
      kind,
      external_media_asset_id,
      url,
      caption: nullableText(body.caption),
      display_order: (last?.display_order ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Create failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ asset: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== 'string') {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.kind === 'logo' || body.kind === 'photo') updates.kind = body.kind;
  if (body.caption !== undefined) updates.caption = nullableText(body.caption);
  if (typeof body.display_order === 'number') updates.display_order = body.display_order;

  const { data, error } = await supabase
    .from('presskit_assets')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ asset: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('presskit_assets').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ ok: true });
}
