import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { buildHeroUpdate, heroSlugFromBody, HERO_INSERT_DEFAULTS } from '@/lib/hero/heroSave';
import { isMissingColumnError, MIGRATION_059_REQUIRED } from '@/lib/site/schemaErrors';

/**
 * Save a page hero. Accepts a flat payload or `{ pageKey, hero: { ... } }`.
 * Partial: only fields present in the request are changed (see lib/hero/heroSave.ts).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const slug = body && typeof body === 'object' ? heroSlugFromBody(body as Record<string, unknown>) : 'home';

    const { data: existing, error: readError } = await supabase
      .from('hero_sections')
      .select('*')
      .eq('page_slug', slug)
      .maybeSingle();
    if (readError) {
      console.error('Admin hero read error:', readError);
      return NextResponse.json({ error: 'Could not read the current hero. Nothing was changed.' }, { status: 500 });
    }

    const built = buildHeroUpdate(body, existing);
    if (!built.ok) return NextResponse.json({ error: built.error }, { status: 400 });

    if (existing) {
      const { data, error } = await supabase
        .from('hero_sections')
        .update(built.update)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) {
        if (isMissingColumnError(error)) return NextResponse.json({ error: MIGRATION_059_REQUIRED }, { status: 409 });
        console.error('Admin hero update error:', error);
        return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
      }
      revalidatePath(slug === 'home' ? '/' : `/${slug}`);
      return NextResponse.json({ hero: data });
    }

    const { data, error } = await supabase
      .from('hero_sections')
      .insert({ page_slug: slug, ...HERO_INSERT_DEFAULTS, ...built.update })
      .select()
      .single();
    if (error) {
      if (isMissingColumnError(error)) return NextResponse.json({ error: MIGRATION_059_REQUIRED }, { status: 409 });
      console.error('Admin hero insert error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath(slug === 'home' ? '/' : `/${slug}`);
    return NextResponse.json({ hero: data });
  } catch (err) {
    console.error('Admin hero POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
