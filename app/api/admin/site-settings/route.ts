import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const {
      artist_name,
      member_1_name,
      member_2_name,
      hero_media_type,
      hero_media_url,
      instagram_url,
      youtube_url,
      spotify_url,
      apple_music_url,
      booking_phone,
      booking_email,
    } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (artist_name != null) updates.artist_name = artist_name;
    if (member_1_name != null) updates.member_1_name = member_1_name;
    if (member_2_name != null) updates.member_2_name = member_2_name;
    if (hero_media_type != null) updates.hero_media_type = hero_media_type;
    if (hero_media_url != null) updates.hero_media_url = hero_media_url;
    if (instagram_url != null) updates.instagram_url = instagram_url;
    if (youtube_url != null) updates.youtube_url = youtube_url;
    if (spotify_url != null) updates.spotify_url = spotify_url;
    if (apple_music_url != null) updates.apple_music_url = apple_music_url;
    if (booking_phone != null) updates.booking_phone = booking_phone;
    if (booking_email != null) updates.booking_email = booking_email;

    // site_settings is a single-row table; UPDATE requires a WHERE clause
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .single();
    if (!existing?.id) {
      return NextResponse.json({ error: 'site_settings row not found', hint: 'Run migrations' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) {
      console.error('Admin site-settings POST error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }

    if (hero_media_url !== undefined || hero_media_type !== undefined) {
      const { data: hs } = await supabase
        .from('hero_sections')
        .select('id')
        .eq('page_slug', 'home')
        .single();
      if (hs) {
        const heroUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (hero_media_url !== undefined) heroUpdates.media_url = hero_media_url;
        if (hero_media_type !== undefined) heroUpdates.media_type = hero_media_type;
        if (hero_media_url === '' || hero_media_url === null) heroUpdates.external_media_asset_id = null;
        await supabase.from('hero_sections').update(heroUpdates).eq('id', hs.id);
      }
    }

    revalidatePath('/');
    revalidatePath('/events');
    revalidatePath('/media');
    revalidatePath('/shop');
    revalidatePath('/booking');
    revalidatePath('/about');
    return NextResponse.json({ settings: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin site-settings POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
