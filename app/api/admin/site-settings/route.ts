import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { checkSocialUrl, SOCIAL_HOSTS } from '@/lib/site/externalLinks';
import { isMissingColumnError, MIGRATION_059_REQUIRED } from '@/lib/site/schemaErrors';
import { checkHomeSectionsInput } from '@/lib/site/homeSections';

/** Migration 059 links: only written when present in the request; empty clears. */
const SOCIAL_FIELDS = [
  { key: 'instagram_secondary_url', hosts: SOCIAL_HOSTS.instagram, name: 'Second Instagram' },
  { key: 'soundcloud_url', hosts: SOCIAL_HOSTS.soundcloud, name: 'SoundCloud' },
  { key: 'beatport_url', hosts: SOCIAL_HOSTS.beatport, name: 'Beatport' },
] as const;

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
    for (const field of SOCIAL_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(body, field.key)) continue;
      const checked = checkSocialUrl(body[field.key], field.hosts, field.name);
      if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
      updates[field.key] = checked.value;
    }

    // site_settings is a single-row table; UPDATE requires a WHERE clause
    const { data: existing } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();
    if (!existing?.id) {
      return NextResponse.json({ error: 'site_settings row not found', hint: 'Run migrations' }, { status: 500 });
    }

    if (Object.prototype.hasOwnProperty.call(body, 'home_sections')) {
      if (!('home_sections' in existing)) return NextResponse.json({ error: MIGRATION_059_REQUIRED }, { status: 409 });
      const checked = checkHomeSectionsInput(body.home_sections);
      if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
      const saved = existing.home_sections && typeof existing.home_sections === 'object' && !Array.isArray(existing.home_sections)
        ? (existing.home_sections as Record<string, unknown>)
        : {};
      updates.home_sections = { ...saved, ...checked.value };
    }

    const { data, error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) {
      if (isMissingColumnError(error)) return NextResponse.json({ error: MIGRATION_059_REQUIRED }, { status: 409 });
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
    revalidatePath('/presskit');
    revalidatePath('/epk');
    revalidatePath('/contact');
    return NextResponse.json({ settings: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin site-settings POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
