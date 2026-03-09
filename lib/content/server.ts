/**
 * Server-only content fetchers. Uses Supabase server client (cookies).
 * Import from here or from '@/lib/content' only in Server Components and route handlers.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { resolveHeroMediaUrl, resolveHeroLogoUrl, resolveHeroSlotImageUrl, resolveHeroSlotVideoUrl, resolveHeroSlotPosterUrl } from '@/lib/storageUrls';
import { withResolvedThumbnails, resolveEventThumbnailUrl } from '@/lib/eventMedia';
import {
  resolveGalleryCoverUrl,
  resolveGalleryMediaUrl,
  resolveVideoThumbnailUrl,
} from '@/lib/mediaGallery';
import type {
  PageSettings,
  HeroSection,
  HeroCarouselSlide,
  HeroSlot,
  HeroSlotResolved,
  HeroSlotIndex,
  Event,
  Gallery,
  GalleryMedia,
  Product,
  BookingContentSection,
  AboutContent,
  AboutPhoto,
  AboutTimelineItem,
  SiteSettings,
} from '@/lib/types/content';
import type { MediaPageVideo, GalleryForHub } from '@/lib/content/shared';

export type { PageSettings, HeroSection, HeroCarouselSlide, Event, Gallery, GalleryMedia, Product, MediaPageVideo, GalleryForHub };

const HERO_SELECT =
  'page_slug, media_type, media_url, media_storage_path, hero_logo_url, hero_logo_storage_path, overlay_opacity, label_text, headline, subtext, cta_text, cta_url, animation_type, animation_enabled, id, created_at, updated_at, external_media_asset_id, hero_slots';

/** Normalize and resolve hero_slots (max 3). Supports Phase 9.1 shape and legacy type/youtube_id shape. */
function resolveHeroSlots(raw: unknown): HeroSlotResolved[] | null {
  if (raw == null) return null;
  let arr: (HeroSlot & { type?: string; youtube_id?: string | null; video_url?: string | null })[];
  if (Array.isArray(raw)) {
    arr = raw.slice(0, 3) as (HeroSlot & { type?: string; youtube_id?: string | null; video_url?: string | null })[];
  } else if (typeof raw === 'object' && raw !== null) {
    arr = [];
    for (let i = 0; i < 3; i++) {
      const slot = (raw as Record<string, unknown>)[i] ?? (raw as Record<string, unknown>)[`slot_${i + 1}`];
      if (slot != null && typeof slot === 'object') arr.push(slot as (HeroSlot & { video_url?: string | null }));
    }
  } else {
    return null;
  }
  const resolved: HeroSlotResolved[] = [];
  for (let i = 0; i < arr.length; i++) {
    const s = arr[i];
    if (!s || typeof s !== 'object') continue;
    const slotIndex = (i + 1) as HeroSlotIndex;
    const opacity = s.overlay_opacity != null ? Math.max(0, Math.min(0.7, Number(s.overlay_opacity))) : null;
    const enabled = s.enabled !== false;

    if (s.media_type === 'image' || (s as { type?: string }).type === 'image') {
      const resolved_image_url = resolveHeroSlotImageUrl(s.image_storage_path) ?? s.image_url ?? null;
      if (enabled && resolved_image_url) {
        resolved.push({
          slot_index: slotIndex,
          enabled: true,
          media_type: 'image',
          resolved_image_url,
          overlay_opacity: opacity,
        });
      }
    } else if (s.media_type === 'video') {
      const fromPath = resolveHeroSlotVideoUrl(s.video_storage_path);
      const directUrl = (s as { video_url?: string | null }).video_url;
      const resolved_video_url = fromPath ?? (typeof directUrl === 'string' && directUrl.trim() ? directUrl.trim() : null) ?? null;
      const resolved_poster_url = resolveHeroSlotPosterUrl(s.poster_storage_path) ?? null;
      if (enabled && resolved_video_url) {
        resolved.push({
          slot_index: slotIndex,
          enabled: true,
          media_type: 'video',
          resolved_video_url,
          resolved_poster_url: resolved_poster_url ?? undefined,
          overlay_opacity: opacity,
        });
      }
    } else if (s.media_type === 'embed' || (s as { type?: string }).type === 'youtube') {
      const embedUrl = s.embed_url ?? (s.embed_provider === 'youtube' && s.embed_id ? `https://www.youtube.com/embed/${s.embed_id}` : null)
        ?? (s.embed_provider === 'vimeo' && s.embed_id ? `https://player.vimeo.com/video/${s.embed_id}` : null);
      const legacyYoutubeId = (s as { youtube_id?: string | null }).youtube_id;
      const resolved_embed_url = embedUrl ?? (legacyYoutubeId ? `https://www.youtube.com/embed/${legacyYoutubeId}` : null);
      if (enabled && resolved_embed_url) {
        resolved.push({
          slot_index: slotIndex,
          enabled: true,
          media_type: 'embed',
          resolved_embed_url,
          overlay_opacity: opacity,
        });
      }
    }
  }
  return resolved.length ? resolved : null;
}

export async function getPageSettings(pageSlug: string): Promise<PageSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('page_settings')
    .select('*')
    .eq('page_slug', pageSlug)
    .single();

  if (error || !data) return null;
  return data as PageSettings;
}

export async function getHeroSection(pageSlug: string): Promise<HeroSection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hero_sections')
    .select(HERO_SELECT)
    .eq('page_slug', pageSlug)
    .single();

  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const mediaFinalUrl = resolveHeroMediaUrl(row);
  const logoFinalUrl = resolveHeroLogoUrl(row);
  const hero_slots = resolveHeroSlots(row.hero_slots);
  return {
    ...row,
    mediaFinalUrl: mediaFinalUrl ?? null,
    logoFinalUrl: logoFinalUrl ?? null,
    hero_slots: hero_slots ?? undefined,
  } as HeroSection;
}

/** Public detail: returns event only if published (when status column exists). */
export async function getEventBySlug(slugOrId: string): Promise<Event | null> {
  const supabase = await createClient();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = uuidRegex.test(slugOrId);
  const slugNorm = isUuid ? slugOrId : slugOrId.trim().toLowerCase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .or(isUuid ? `id.eq.${slugOrId}` : `slug.eq.${slugNorm}`)
    .maybeSingle();
  if (error || !data) return null;
  const event = data as Event & { status?: string };
  if (event.status != null && event.status !== 'published') return null;
  event.resolved_thumbnail_url = await resolveEventThumbnailUrl(event);
  return event;
}

/** Public list: only published events (or all if status column not yet present). */
export async function getEvents(options?: { upcomingOnly?: boolean }): Promise<Event[]> {
  const supabase = await createClient();
  let query = supabase
    .from('events')
    .select('*')
    .order('display_order', { ascending: true })
    .order('date', { ascending: true });

  const { data, error } = await query;
  if (error) return [];
  let events = (data || []) as Event[];
  const withStatus = events.some((e) => 'status' in e && e.status != null);
  if (withStatus) events = events.filter((e) => (e as { status?: string }).status === 'published');

  if (options?.upcomingOnly) {
    events = events.filter((e) => new Date(e.date) >= new Date());
  }
  return withResolvedThumbnails(events);
}

export async function getGalleries(): Promise<Gallery[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as Gallery[];
}

export async function getGalleryMedia(galleryId: string): Promise<GalleryMedia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('gallery_media')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as GalleryMedia[];
}

export async function getMediaCarouselSlides(): Promise<
  { id: string; media_type: string; url: string; thumbnail_url: string | null; caption: string | null; display_order: number }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('media_carousel_slides')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as { id: string; media_type: string; url: string; thumbnail_url: string | null; caption: string | null; display_order: number }[];
}

export async function getGalleriesForHub(): Promise<GalleryForHub[]> {
  const supabase = await createClient();
  const [galleriesRes, mediaRes] = await Promise.all([
    supabase.from('galleries').select('*').order('display_order', { ascending: true }),
    supabase.from('gallery_media').select('gallery_id'),
  ]);

  if (galleriesRes.error) return [];
  let galleries = (galleriesRes.data || []) as Gallery[];
  const withStatus = galleries.some((g) => 'status' in g && (g as { status?: string }).status != null);
  if (withStatus) galleries = galleries.filter((g) => (g as { status?: string }).status === 'published');

  const countByGalleryId: Record<string, number> = {};
  if (!mediaRes.error && mediaRes.data) {
    for (const row of mediaRes.data as { gallery_id: string }[]) {
      countByGalleryId[row.gallery_id] = (countByGalleryId[row.gallery_id] ?? 0) + 1;
    }
  }

  const withResolved = await Promise.all(
    galleries.map(async (g) => {
      const resolved_cover_url = await resolveGalleryCoverUrl(g);
      const media_count = countByGalleryId[g.id] ?? 0;
      return { ...g, resolved_cover_url, media_count };
    })
  );
  return withResolved;
}

export async function getGalleriesWithMedia(): Promise<(Gallery & { gallery_media: GalleryMedia[] })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('galleries')
    .select('*, gallery_media(*)')
    .order('display_order', { ascending: true });

  if (error) return [];

  const raw = (data || []).map((g: { gallery_media?: GalleryMedia[] }) => ({
    ...g,
    gallery_media: (g.gallery_media || []).sort(
      (a: GalleryMedia, b: GalleryMedia) => (a.display_order ?? 0) - (b.display_order ?? 0)
    ),
  })) as (Gallery & { gallery_media: GalleryMedia[] })[];

  const withResolved = await Promise.all(
    raw.map(async (g) => {
      const resolved_cover_url = await resolveGalleryCoverUrl(g);
      const gallery_media = await Promise.all(
        g.gallery_media.map(async (m) => {
          const { url, thumbnailUrl } = await resolveGalleryMediaUrl(m);
          return {
            ...m,
            resolved_url: url,
            resolved_thumbnail_url: thumbnailUrl,
          };
        })
      );
      return { ...g, resolved_cover_url, gallery_media };
    })
  );
  return withResolved;
}

export async function getGalleryBySlug(
  slug: string
): Promise<(Gallery & { gallery_media: GalleryMedia[] }) | null> {
  const supabase = await createClient();
  const normalizedSlug = slug.trim().toLowerCase();
  const { data, error } = await supabase
    .from('galleries')
    .select('*, gallery_media(*)')
    .eq('slug', normalizedSlug)
    .single();

  if (error || !data) return null;
  const gData = data as Gallery & { gallery_media: GalleryMedia[]; status?: string };
  if (gData.status != null && gData.status !== 'published') return null;

  const g = gData as Gallery & { gallery_media: GalleryMedia[] };
  const gallery_media = (g.gallery_media || []).sort(
    (a: GalleryMedia, b: GalleryMedia) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  const resolved_cover_url = await resolveGalleryCoverUrl(g);
  const resolvedMedia = await Promise.all(
    gallery_media.map(async (m) => {
      const { url, thumbnailUrl } = await resolveGalleryMediaUrl(m);
      return { ...m, resolved_url: url, resolved_thumbnail_url: thumbnailUrl };
    })
  );

  return { ...g, resolved_cover_url, gallery_media: resolvedMedia };
}

/** Public list: only published products (or is_active if status column not yet present). */
export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from('products')
    .select('*, product_images(image_url, display_order), product_variants(id, name, price_cents, inventory_count)')
    .order('display_order', { ascending: true });
  const { data, error } = await query;
  if (error) return [];
  let products = (data || []) as Product[];
  const withStatus = products.some((p) => 'status' in p && (p as { status?: string }).status != null);
  if (withStatus) products = products.filter((p) => (p as { status?: string }).status === 'published');
  else products = products.filter((p) => p.is_active);
  return products;
}

export async function getBookingContent(): Promise<BookingContentSection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('booking_content')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as BookingContentSection[];
}

export async function getAboutContent(): Promise<AboutContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as AboutContent;
}

export async function getAboutPhotos(): Promise<AboutPhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about_photos')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as AboutPhoto[];
}

export async function getAboutTimeline(): Promise<AboutTimelineItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about_timeline')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as AboutTimelineItem[];
}

/** Public list: only published videos (or all if status column not yet present). */
export async function getVideos(): Promise<MediaPageVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, youtube_id, thumbnail_url, status')
    .order('display_order', { ascending: true });

  if (error) return [];
  const rows = (data || []) as { id: string; title: string; youtube_id: string; thumbnail_url?: string | null; status?: string }[];
  const withStatus = rows.some((r) => r.status != null);
  const filtered = withStatus ? rows.filter((r) => r.status === 'published') : rows;
  return filtered.map((v) => ({
    ...v,
    resolved_thumbnail_url: resolveVideoThumbnailUrl(v),
  }));
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as SiteSettings;
}
