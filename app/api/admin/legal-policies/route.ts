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

function isPolicyStatus(s: unknown): s is 'draft' | 'published' {
  return s === 'draft' || s === 'published';
}

function parseEffectiveDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  return trimmed;
}

/** Upsert one policy by slug. Accepts status and effective_date; never invents copy. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { slug, title, body_md, status, effective_date } = body as {
      slug?: string;
      title?: string;
      body_md?: string;
      status?: string;
      effective_date?: string | null;
    };
    if (!isAllowedSlug(slug)) return NextResponse.json({ error: 'Unknown slug' }, { status: 400 });
    if (typeof title !== 'string' || typeof body_md !== 'string') {
      return NextResponse.json({ error: 'title and body_md required' }, { status: 400 });
    }

    const nextStatus = status === undefined ? undefined : status;
    if (nextStatus !== undefined && !isPolicyStatus(nextStatus)) {
      return NextResponse.json({ error: 'status must be draft or published' }, { status: 400 });
    }

    const nextEffective = parseEffectiveDate(effective_date);
    if (effective_date !== undefined && nextEffective === undefined) {
      return NextResponse.json({ error: 'effective_date must be YYYY-MM-DD or empty' }, { status: 400 });
    }

    if (nextStatus === 'published' && !body_md.trim()) {
      return NextResponse.json({ error: 'Cannot publish an empty policy. Paste reviewed copy first.' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      slug,
      title,
      body_md,
      updated_at: new Date().toISOString(),
    };
    if (nextStatus !== undefined) payload.status = nextStatus;
    if (effective_date !== undefined) payload.effective_date = nextEffective ?? null;

    const { data, error } = await supabase
      .from('legal_policies')
      .upsert(payload, { onConflict: 'slug' })
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
