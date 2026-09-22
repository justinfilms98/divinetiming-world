import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'press-release';
}

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const status = body.status === 'published' ? 'published' : 'draft';
  const slug = slugify(typeof body.slug === 'string' && body.slug.trim() ? body.slug : title);

  const { data, error } = await supabase
    .from('press_releases')
    .insert({
      title,
      slug: `${slug}-${Date.now().toString(36)}`,
      body_md: nullableText(body.body_md),
      published_at: nullableText(body.published_at),
      external_url: nullableText(body.external_url),
      status,
      display_order: typeof body.display_order === 'number' ? body.display_order : 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Create failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ release: data });
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
  if (typeof body.title === 'string') updates.title = body.title.trim();
  if (typeof body.slug === 'string' && body.slug.trim()) updates.slug = slugify(body.slug);
  if (body.body_md !== undefined) updates.body_md = nullableText(body.body_md);
  if (body.published_at !== undefined) updates.published_at = nullableText(body.published_at);
  if (body.external_url !== undefined) updates.external_url = nullableText(body.external_url);
  if (body.status === 'draft' || body.status === 'published') updates.status = body.status;
  if (typeof body.display_order === 'number') updates.display_order = body.display_order;

  const { data, error } = await supabase
    .from('press_releases')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ release: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('press_releases').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ ok: true });
}
