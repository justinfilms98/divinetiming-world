import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const { data, error } = await supabase
    .from('booking_content')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sections: data ?? [] });
}

const DEFAULT_SECTIONS = [
  { title: 'We are Divine Timing', description: 'We are an electronic duo crafting moments between rhythm and reflection. Our sound lives at the intersection of dance and contemplation.', display_order: 0, align_preference: 'left', accent: null },
  { title: 'What Divine Timing means', description: 'Divine Timing is the belief that the right moment finds you when you are ready. Our music is an invitation to that moment.', display_order: 1, align_preference: 'right', accent: null },
  { title: 'How it started', description: 'From shared sessions to festival stages, we built this project on trust in the process and in each other.', display_order: 2, align_preference: 'left', accent: null },
  { title: 'Our goal', description: "We want to bring this energy to your event—whether a club night, a festival, or a unique collaboration. Let's create something together.", display_order: 3, align_preference: 'right', accent: null },
];

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  try {
    const body = await request.json();
    const { reset, id, title, description, display_order, align_preference, accent } = body;

    if (reset === true) {
      const { error: delErr } = await supabase.from('booking_content').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      const { data: inserted, error: insErr } = await supabase
        .from('booking_content')
        .insert(DEFAULT_SECTIONS)
        .select();
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
      revalidatePath('/booking');
      return NextResponse.json({ sections: inserted ?? [] });
    }

    if (id) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (display_order !== undefined) updates.display_order = display_order;
      if (align_preference !== undefined) updates.align_preference = align_preference || 'auto';
      if (accent !== undefined) updates.accent = accent || null;
      const { data, error } = await supabase
        .from('booking_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/booking');
      return NextResponse.json({ section: data });
    }
    const { data: maxOrder } = await supabase
      .from('booking_content')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    const order = display_order ?? (maxOrder?.display_order ?? -1) + 1;
    const { data, error } = await supabase
      .from('booking_content')
      .insert({
        title: title ?? '',
        description: description ?? null,
        display_order: order,
        align_preference: align_preference || 'auto',
        accent: accent || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath('/booking');
    return NextResponse.json({ section: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
