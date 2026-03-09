import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { data, error } = await supabase
    .from('presskit')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to load press kit' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Press kit not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const body = await request.json().catch(() => ({}));
  const {
    title,
    bio_text,
    experience_text,
    audience_text,
    links_text,
    tech_rider_text,
    pdf_url,
  } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof title === 'string') updates.title = title;
  if (typeof bio_text === 'string') updates.bio_text = bio_text;
  if (typeof experience_text === 'string') updates.experience_text = experience_text;
  if (audience_text !== undefined) updates.audience_text = audience_text == null ? null : String(audience_text);
  if (links_text !== undefined) updates.links_text = links_text == null ? null : String(links_text);
  if (tech_rider_text !== undefined) updates.tech_rider_text = tech_rider_text == null ? null : String(tech_rider_text);
  if (pdf_url !== undefined) updates.pdf_url = pdf_url == null || pdf_url === '' ? null : String(pdf_url);

  const { data: existing } = await supabase.from('presskit').select('id').limit(1).single();
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
  return NextResponse.json(data);
}
