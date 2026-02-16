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
      media_type,
      external_media_asset_id,
      media_url,
      overlay_opacity,
      headline,
      subtext,
      cta_text,
      cta_url,
      animation_type,
      animation_enabled,
    } = body;

    const slug = page_slug ?? 'home';
    const heroData = {
      media_type: media_type ?? 'default',
      external_media_asset_id: external_media_asset_id ?? null,
      media_url: media_url ?? null,
      overlay_opacity: overlay_opacity ?? 0.4,
      headline: headline ?? null,
      subtext: subtext ?? null,
      cta_text: cta_text ?? null,
      cta_url: cta_url ?? null,
      animation_type: animation_type ?? 'warp',
      animation_enabled: animation_enabled ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('hero_sections')
      .select('id')
      .eq('page_slug', slug)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('hero_sections')
        .update(heroData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) {
        console.error('Admin hero update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      revalidatePath(slug === 'home' ? '/' : `/${slug}`);
      return NextResponse.json({ hero: data });
    }

    const { data, error } = await supabase
      .from('hero_sections')
      .insert({ page_slug: slug, ...heroData })
      .select()
      .single();
    if (error) {
      console.error('Admin hero insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath(slug === 'home' ? '/' : `/${slug}`);
    return NextResponse.json({ hero: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin hero POST error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
