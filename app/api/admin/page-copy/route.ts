import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { checkEventsCopyInput } from '@/lib/site/eventsCopy';
import { isMissingColumnError, MIGRATION_059_REQUIRED } from '@/lib/site/schemaErrors';

/**
 * Save editable section text for a page (page_settings.section_copy). Only the Events page uses it.
 * Fields sent are merged into the saved set; empty values clear back to the default wording.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (body?.page_slug !== 'events') return NextResponse.json({ error: 'Only the Events page has editable section text.' }, { status: 400 });
  const checked = checkEventsCopyInput(body.section_copy);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  try {
    const { data: existing, error: readError } = await supabase.from('page_settings').select('*').eq('page_slug', 'events').maybeSingle();
    if (readError) {
      console.error('Admin page-copy read error:', readError);
      return NextResponse.json({ error: 'Could not read the Events page settings. Nothing was changed.' }, { status: 500 });
    }
    if (existing && !('section_copy' in existing)) return NextResponse.json({ error: MIGRATION_059_REQUIRED }, { status: 409 });

    const saved =
      existing?.section_copy && typeof existing.section_copy === 'object' && !Array.isArray(existing.section_copy)
        ? (existing.section_copy as Record<string, unknown>)
        : {};
    const merged: Record<string, unknown> = { ...saved };
    for (const [key, v] of Object.entries(checked.value)) {
      if (v === null) delete merged[key];
      else merged[key] = v;
    }
    const now = new Date().toISOString();

    const result = existing
      ? await supabase.from('page_settings').update({ section_copy: merged, updated_at: now }).eq('id', existing.id).select().single()
      : await supabase.from('page_settings').insert({ page_slug: 'events', section_copy: merged, updated_at: now }).select().single();
    if (result.error) {
      if (isMissingColumnError(result.error)) return NextResponse.json({ error: MIGRATION_059_REQUIRED }, { status: 409 });
      console.error('Admin page-copy save error:', result.error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }

    revalidatePath('/events');
    return NextResponse.json({ section_copy: (result.data as Record<string, unknown>)?.section_copy ?? merged });
  } catch (err) {
    console.error('Admin page-copy POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
