import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/supabase/service';

function isAdmin(email: string): boolean {
  const admins = process.env.ADMIN_EMAILS;
  if (admins) {
    const list = admins.split(',').map((e) => e.trim().toLowerCase());
    if (list.includes(email.toLowerCase())) return true;
  }
  return false;
}

async function requireAdmin() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const email = user.email.toLowerCase();
  let allowed = isAdmin(email);
  if (!allowed) {
    const { data } = await authClient
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();
    allowed = !!data;
  }
  if (!allowed) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  let supabase;
  try {
    supabase = getServiceClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SUPABASE_SERVICE_ROLE_KEY not configured';
    return { error: NextResponse.json({ error: msg }, { status: 500 }) };
  }
  return { supabase };
}

function generateEventSlug(title: string | null, city: string | null, date: string | null): string {
  const base = (title || city || 'event').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
  const datePart = date ? new Date(date).toISOString().slice(0, 10) : 'null';
  return `${base}-${datePart}-${Date.now().toString(36)}`;
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
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/events');
      revalidatePath(`/events/${(data as { slug?: string })?.slug || id}`);
      return NextResponse.json({ event: data });
    }

    const order = display_order != null ? display_order : 0;
    const slug = generateEventSlug(title || null, city || null, date || null);
    const { data, error } = await supabase
      .from('events')
      .insert({ ...eventData, display_order: order, slug })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath('/events');
    return NextResponse.json({ event: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin events POST error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
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
      return NextResponse.json({ error: 'swap array with 2 items required' }, { status: 400 });
    }
    const [a, b] = swap;
    await supabase.from('events').update({ display_order: b.display_order, updated_at: new Date().toISOString() }).eq('id', a.id);
    await supabase.from('events').update({ display_order: a.display_order, updated_at: new Date().toISOString() }).eq('id', b.id);
    revalidatePath('/events');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin events PATCH error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath('/events');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin events DELETE error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
