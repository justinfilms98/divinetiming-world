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
      page_slug,
      seo_title,
      seo_description,
      hero,
      booking_about_title,
      booking_about_body,
      booking_about_asset_id,
      booking_about_image_url,
    } = body;

    const slug = page_slug ?? 'home';
    const paths = slug === 'home' ? ['/'] : [`/${slug}`];

    const psUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (seo_title !== undefined) psUpdates.seo_title = seo_title;
    if (seo_description !== undefined) psUpdates.seo_description = seo_description;
    if (slug === 'booking') {
      if (booking_about_title !== undefined) psUpdates.booking_about_title = booking_about_title;
      if (booking_about_body !== undefined) psUpdates.booking_about_body = booking_about_body;
      if (booking_about_asset_id !== undefined) psUpdates.booking_about_asset_id = booking_about_asset_id;
      if (booking_about_image_url !== undefined) psUpdates.booking_about_image_url = booking_about_image_url;
    }

    if (Object.keys(psUpdates).length > 1) {
      const { data: ps } = await supabase
        .from('page_settings')
        .select('id')
        .eq('page_slug', slug)
        .single();

      if (ps) {
        const { error } = await supabase
          .from('page_settings')
          .update(psUpdates)
          .eq('id', ps.id);
        if (error) {
          console.error('Admin page-settings update error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    if (hero && typeof hero === 'object') {
      const heroData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (hero.media_type != null) heroData.media_type = hero.media_type;
      if (hero.external_media_asset_id != null) heroData.external_media_asset_id = hero.external_media_asset_id;
      if (hero.media_url != null) heroData.media_url = hero.media_url;
      if (hero.overlay_opacity != null) heroData.overlay_opacity = hero.overlay_opacity;
      if (hero.headline != null) heroData.headline = hero.headline;
      if (hero.subtext != null) heroData.subtext = hero.subtext;
      if (hero.cta_text != null) heroData.cta_text = hero.cta_text;
      if (hero.cta_url != null) heroData.cta_url = hero.cta_url;
      if (hero.animation_type != null) heroData.animation_type = hero.animation_type;
      if (hero.animation_enabled != null) heroData.animation_enabled = hero.animation_enabled;
      const { data: hs } = await supabase
        .from('hero_sections')
        .select('id')
        .eq('page_slug', slug)
        .single();

      if (hs) {
        const { error } = await supabase
          .from('hero_sections')
          .update(heroData)
          .eq('id', hs.id);
        if (error) {
          console.error('Admin hero (page-settings) update error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    for (const p of paths) revalidatePath(p);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin page-settings POST error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
