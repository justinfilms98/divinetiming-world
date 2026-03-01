import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { sanitizeBioHtml } from '@/lib/sanitize-bio-html';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { data, error } = await supabase
    .from('about_content')
    .select('id, bio_text, bio_html, created_at, updated_at')
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'about_content not found' },
      { status: error?.code === 'PGRST116' ? 404 : 500 }
    );
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { bio_html: rawHtml } = body;

    const bioHtml = typeof rawHtml === 'string' ? sanitizeBioHtml(rawHtml) : '';

    const { data: existing } = await supabase
      .from('about_content')
      .select('id')
      .limit(1)
      .single();

    if (!existing?.id) {
      return NextResponse.json(
        { error: 'about_content row not found', hint: 'Run migrations' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('about_content')
      .update({ bio_html: bioHtml || null, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Admin about-content POST error:', error);
      return NextResponse.json(
        { error: error.message, hint: error.details ?? undefined },
        { status: 500 }
      );
    }

    revalidatePath('/about');
    return NextResponse.json({ about: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin about-content POST error:', err);
    return NextResponse.json({ error: msg, hint: 'Check server logs' }, { status: 500 });
  }
}
