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
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return NextResponse.json({ error: 'label required' }, { status: 400 });

  const yearRaw = body.year;
  const year =
    yearRaw === '' || yearRaw === null || yearRaw === undefined
      ? null
      : Number.parseInt(String(yearRaw), 10);
  if (year !== null && !Number.isFinite(year)) {
    return NextResponse.json({ error: 'year must be a number' }, { status: 400 });
  }

  const { data: last } = await supabase
    .from('presskit_performances')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('presskit_performances')
    .insert({
      label,
      venue: nullableText(body.venue),
      city: nullableText(body.city),
      country: nullableText(body.country),
      year,
      display_order: (last?.display_order ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Create failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ performance: data });
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
  if (typeof body.label === 'string') updates.label = body.label.trim();
  if (body.venue !== undefined) updates.venue = nullableText(body.venue);
  if (body.city !== undefined) updates.city = nullableText(body.city);
  if (body.country !== undefined) updates.country = nullableText(body.country);
  if (body.year !== undefined) {
    if (body.year === '' || body.year === null) updates.year = null;
    else {
      const year = Number.parseInt(String(body.year), 10);
      if (!Number.isFinite(year)) return NextResponse.json({ error: 'year must be a number' }, { status: 400 });
      updates.year = year;
    }
  }
  if (typeof body.display_order === 'number') updates.display_order = body.display_order;

  const { data, error } = await supabase
    .from('presskit_performances')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ performance: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('presskit_performances').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ ok: true });
}
