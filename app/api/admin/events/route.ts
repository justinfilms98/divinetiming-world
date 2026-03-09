import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { apiSuccess, apiError } from '@/lib/apiResponses';
import { withResolvedThumbnails } from '@/lib/eventMedia';
import type { Event } from '@/lib/types/content';

/** Kebab-case, lowercase slug. Used for URLs. */
function generateEventSlug(title: string | null, city: string | null, date: string | null): string {
  const base = (title || city || 'event').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
  const datePart = date ? new Date(date).toISOString().slice(0, 10) : 'null';
  return `${base}-${datePart}-${Date.now().toString(36)}`;
}

function toKebabSlug(s: string | null | undefined): string {
  if (!s || typeof s !== 'string') return '';
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
}

/** List events (admin). Returns events with resolved_thumbnail_url. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('display_order', { ascending: true })
      .order('date', { ascending: true });
    if (error) return apiError('Operation failed.', 500);
    const events = (data || []) as Event[];
    const withResolved = await withResolvedThumbnails(events);
    return apiSuccess(withResolved);
  } catch (err) {
    return apiError('Operation failed.', 500);
  }
}

/** Create or update an event (service role to avoid RLS issues) */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const {
      id,
      date,
      city,
      venue,
      ticket_url,
      is_featured,
      title,
      description,
      time,
      thumbnail_url,
      external_thumbnail_asset_id,
      display_order,
      slug: slugInput,
    } = body;

    const now = new Date().toISOString();
    const eventData: Record<string, unknown> = {
      date: date ?? null,
      city: city ?? null,
      venue: venue ?? null,
      ticket_url: ticket_url || null,
      is_featured: !!is_featured,
      title: title || null,
      description: description || null,
      time: time || null,
      thumbnail_url: thumbnail_url || null,
      external_thumbnail_asset_id: external_thumbnail_asset_id || null,
      updated_at: now,
    };

    if (id) {
      const slugNorm = slugInput != null && String(slugInput).trim()
        ? toKebabSlug(String(slugInput).trim())
        : undefined;
      if (slugNorm !== undefined) (eventData as Record<string, unknown>).slug = slugNorm || null;
      if (slugNorm) {
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('slug', slugNorm)
          .maybeSingle();
        if (existing && (existing as { id: string }).id !== id) {
          return apiError('Another event already uses this slug', 409);
        }
      }
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();
      if (error) return apiError('Operation failed.', 500);
      const slug = (data as { slug?: string })?.slug;
      revalidatePath('/events');
      revalidatePath(`/events/${slug ?? id}`);
      return apiSuccess({ event: data });
    }

    const order = display_order != null ? display_order : 0;
    const slug = (slugInput != null && String(slugInput).trim())
      ? toKebabSlug(String(slugInput).trim())
      : generateEventSlug(title || null, city || null, date || null);
    if (!slug) return apiError('Slug is required', 400);
    const { data: collision } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (collision) return apiError('An event with this slug already exists', 409);
    const { data, error } = await supabase
      .from('events')
      .insert({ ...eventData, display_order: order, slug })
      .select()
      .single();
    if (error) return apiError('Operation failed.', 500);
    revalidatePath('/events');
    return apiSuccess({ event: data });
  } catch (err) {
    return apiError('Operation failed.', 500);
  }
}

/** Reorder events (swap display_order of two events) */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { swap } = body as { swap?: [{ id: string; display_order: number }, { id: string; display_order: number }] };
    if (!Array.isArray(swap) || swap.length !== 2) {
      return apiError('swap array with 2 items required', 400);
    }
    const [a, b] = swap;
    await supabase.from('events').update({ display_order: b.display_order, updated_at: new Date().toISOString() }).eq('id', a.id);
    await supabase.from('events').update({ display_order: a.display_order, updated_at: new Date().toISOString() }).eq('id', b.id);
    revalidatePath('/events');
    return apiSuccess({});
  } catch (err) {
    return apiError('Operation failed.', 500);
  }
}

/** Delete an event */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiError('id required', 400);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return apiError('Operation failed.', 500);
    revalidatePath('/events');
    return apiSuccess({});
  } catch (err) {
    return apiError('Operation failed.', 500);
  }
}
