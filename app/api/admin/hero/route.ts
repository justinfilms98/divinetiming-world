import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { validateHeroLogoUrl } from '@/lib/hero-validation';
import { normalizeHeroSlots } from '@/lib/content/shared';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();

    // Support both flat payload and { pageKey, hero: { ... } }
    let slug: string = body.page_slug ?? body.pageKey ?? 'home';
    let heroData: Record<string, unknown>;

    if (body.hero && typeof body.hero === 'object') {
      const h = body.hero as Record<string, unknown>;
      const overlay = h.overlayOpacity ?? h.overlay_opacity ?? 0.4;
      const raw = typeof overlay === 'number' ? overlay : Number(overlay);
      const num = raw <= 1 && raw >= 0 ? raw : Math.min(1, Math.max(0, raw / 100));
      const rawLogo = (h.hero_logo_url as string) ?? (h.heroLogoUrl as string) ?? null;
      const hero_logo_url = validateHeroLogoUrl(rawLogo);
      if (hero_logo_url === undefined) {
        return NextResponse.json(
          { error: 'hero_logo_url must be null or a valid http(s) URL' },
          { status: 400 }
        );
      }
      heroData = {
        media_type: (h.type as string) ?? (h.media_type as string) ?? 'default',
        external_media_asset_id: (h.external_media_asset_id as string) ?? null,
        media_url: (h.url as string) ?? (h.media_url as string) ?? null,
        media_storage_path: (h.media_storage_path as string) ?? null,
        hero_logo_url,
        hero_logo_storage_path: (h.hero_logo_storage_path as string) ?? null,
        overlay_opacity: Math.min(1, Math.max(0, num)),
        headline: (h.headline as string) ?? null,
        subtext: (h.subtext as string) ?? null,
        cta_text: (h.ctaLabel as string) ?? (h.cta_text as string) ?? null,
        cta_url: (h.ctaHref as string) ?? (h.cta_url as string) ?? null,
        animation_type: (h.animation_type as string) ?? 'warp',
        animation_enabled: (h.animation_enabled as boolean) ?? true,
        updated_at: new Date().toISOString(),
      };
      if (h.hero_slots !== undefined) {
        const result = normalizeHeroSlots(h.hero_slots);
        if (result && 'error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
        heroData.hero_slots = Array.isArray(result) ? result : (Array.isArray(h.hero_slots) ? h.hero_slots.slice(0, 3) : null);
      }
    } else {
      const {
        page_slug,
        media_type,
        external_media_asset_id,
        media_url,
        media_storage_path,
        hero_logo_url: rawLogoFlat,
        hero_logo_storage_path,
        overlay_opacity,
        headline,
        subtext,
        cta_text,
        cta_url,
        animation_type,
        animation_enabled,
        hero_slots: rawSlots,
      } = body;
      const hero_logo_url = validateHeroLogoUrl(rawLogoFlat ?? null);
      if (hero_logo_url === undefined) {
        return NextResponse.json(
          { error: 'hero_logo_url must be null or a valid http(s) URL' },
          { status: 400 }
        );
      }
      heroData = {
        media_type: media_type ?? 'default',
        external_media_asset_id: external_media_asset_id ?? null,
        media_url: media_url ?? null,
        media_storage_path: media_storage_path ?? null,
        hero_logo_url,
        hero_logo_storage_path: hero_logo_storage_path ?? null,
        overlay_opacity: overlay_opacity ?? 0.4,
        headline: headline ?? null,
        subtext: subtext ?? null,
        cta_text: cta_text ?? null,
        cta_url: cta_url ?? null,
        animation_type: animation_type ?? 'warp',
        animation_enabled: animation_enabled ?? true,
        updated_at: new Date().toISOString(),
      };
      if (rawSlots !== undefined) {
        const result = normalizeHeroSlots(rawSlots);
        if (result && 'error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
        heroData.hero_slots = Array.isArray(result) ? result : (Array.isArray(rawSlots) ? rawSlots.slice(0, 3) : null);
      }
    }

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
