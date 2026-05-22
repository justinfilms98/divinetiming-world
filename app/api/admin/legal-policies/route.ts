import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

const ALLOWED_SLUGS = ['privacy', 'terms', 'refund', 'shipping'] as const;
type Slug = (typeof ALLOWED_SLUGS)[number];

function isAllowedSlug(s: unknown): s is Slug {
  return typeof s === 'string' && (ALLOWED_SLUGS as readonly string[]).includes(s);
}

/** Read-all or per-slug read. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    if (!isAllowedSlug(slug)) return NextResponse.json({ error: 'Unknown slug' }, { status: 400 });
    const { data, error } = await supabase
      .from('legal_policies')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) {
      console.error('Admin legal-policies GET error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    return NextResponse.json({ policy: data });
  }

  const { data, error } = await supabase.from('legal_policies').select('*').order('slug');
  if (error) {
    console.error('Admin legal-policies GET error:', error);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
  return NextResponse.json({ policies: data ?? [] });
}

/** Upsert one policy by slug. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { slug, title, body_md } = body as { slug?: string; title?: string; body_md?: string };
    if (!isAllowedSlug(slug)) return NextResponse.json({ error: 'Unknown slug' }, { status: 400 });
    if (typeof title !== 'string' || typeof body_md !== 'string') {
      return NextResponse.json({ error: 'title and body_md required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('legal_policies')
      .upsert(
        { slug, title, body_md, updated_at: new Date().toISOString() },
        { onConflict: 'slug' }
      )
      .select()
      .single();
    if (error) {
      console.error('Admin legal-policies POST error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath(`/${slug}`);
    return NextResponse.json({ policy: data });
  } catch (err) {
    console.error('Admin legal-policies POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
