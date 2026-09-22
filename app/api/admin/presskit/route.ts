import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

function nullableText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  return value.trim() || null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const [kitRes, assetsRes, releasesRes, performancesRes] = await Promise.all([
    supabase.from('presskit').select('*').limit(1).maybeSingle(),
    supabase.from('presskit_assets').select('*').order('display_order', { ascending: true }),
    supabase.from('press_releases').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('presskit_performances').select('*').order('display_order', { ascending: true }),
  ]);

  if (kitRes.error && kitRes.error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to load press kit' }, { status: 500 });
  }
  if (!kitRes.data) {
    return NextResponse.json({ error: 'Press kit not found' }, { status: 404 });
  }

  return NextResponse.json({
    presskit: kitRes.data,
    assets: assetsRes.data ?? [],
    releases: releasesRes.data ?? [],
    performances: performancesRes.data ?? [],
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const fields = [
    'title',
    'bio_text',
    'short_bio',
    'long_bio',
    'experience_text',
    'audience_text',
    'links_text',
    'tech_rider_text',
    'tech_rider_url',
    'hospitality_rider_text',
    'hospitality_rider_url',
    'performance_reel_url',
    'booking_contact_name',
    'booking_contact_email',
    'booking_contact_phone',
    'pdf_url',
  ] as const;

  for (const key of fields) {
    if (!(key in body)) continue;
    const parsed = nullableText(body[key]);
    if (parsed === undefined && key !== 'title' && key !== 'bio_text' && key !== 'experience_text') continue;
    if (key === 'title' || key === 'bio_text' || key === 'experience_text') {
      if (typeof body[key] === 'string') updates[key] = body[key];
      continue;
    }
    updates[key] = parsed ?? null;
  }

  const { data: existing } = await supabase.from('presskit').select('id').limit(1).maybeSingle();
  if (!existing?.id) {
    return NextResponse.json({ error: 'Press kit row not found' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('presskit')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
  revalidatePath('/presskit');
  return NextResponse.json({ presskit: data });
}
