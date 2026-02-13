/**
 * Phase 1 Content API - Centralized content fetching
 * All pages pull from DB via these functions. No hardcoded content.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PageSettings,
  HeroSection,
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

// Re-export types
export type { PageSettings, HeroSection, Event, Gallery, GalleryMedia, Product };

/** Page slugs for content lookup */
export const PAGE_SLUGS = ['home', 'events', 'media', 'shop', 'booking', 'about'] as const;

/** Get page settings by slug */
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

/** Get hero section by page slug */
export async function getHeroSection(pageSlug: string): Promise<HeroSection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hero_sections')
    .select('*')
    .eq('page_slug', pageSlug)
    .single();

  if (error || !data) return null;
  return data as HeroSection;
}

/** Get all events (upcoming first, then by display_order) */
export async function getEvents(options?: { upcomingOnly?: boolean }): Promise<Event[]> {
  const supabase = await createClient();
  let query = supabase
    .from('events')
    .select('*')
    .order('display_order', { ascending: true })
    .order('date', { ascending: true });

  if (options?.upcomingOnly) {
    query = query.gte('date', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Event[];
}

/** Get all galleries */
export async function getGalleries(): Promise<Gallery[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as Gallery[];
}

/** Get media for a gallery */
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

/** Get media carousel slides (for media page hero) */
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

/** Get galleries with their media (for media page) */
export async function getGalleriesWithMedia(): Promise<(Gallery & { gallery_media: GalleryMedia[] })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('galleries')
    .select('*, gallery_media(*)')
    .order('display_order', { ascending: true });

  if (error) return [];

  return (data || []).map((g) => ({
    ...g,
    gallery_media: (g.gallery_media || []).sort(
      (a: GalleryMedia, b: GalleryMedia) => (a.display_order ?? 0) - (b.display_order ?? 0)
    ),
  })) as (Gallery & { gallery_media: GalleryMedia[] })[];
}

/** Get active products */
export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(image_url, display_order), product_variants(id, name, price_cents, inventory_count)')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as Product[];
}

/** Get booking content sections */
export async function getBookingContent(): Promise<BookingContentSection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('booking_content')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as BookingContentSection[];
}

/** Get about content (bio) */
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

/** Get about photos */
export async function getAboutPhotos(): Promise<AboutPhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about_photos')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as AboutPhoto[];
}

/** Get about timeline */
export async function getAboutTimeline(): Promise<AboutTimelineItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about_timeline')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as AboutTimelineItem[];
}

/** Get videos (legacy table - used for media page Videos tab) */
export async function getVideos(): Promise<{ id: string; title: string; youtube_id: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, youtube_id')
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data || []) as { id: string; title: string; youtube_id: string }[];
}

/** Get site settings (social links, member names, etc.) */
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
