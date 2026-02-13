/**
 * Phase 1 Content Architecture - TypeScript types
 * All content entities pulled from database
 */

export type PageSlug = 'home' | 'events' | 'media' | 'shop' | 'booking' | 'about';

export interface PageSettings {
  id: string;
  page_slug: PageSlug;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeroSection {
  id: string;
  page_slug: PageSlug;
  media_type: 'image' | 'video' | 'default';
  media_url: string | null;
  overlay_opacity: number;
  headline: string | null;
  subtext: string | null;
  cta_text: string | null;
  cta_url: string | null;
  animation_type: 'warp' | 'clock' | 'none';
  animation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  date: string;
  city: string;
  venue: string;
  ticket_url: string | null;
  is_featured: boolean;
  title: string | null;
  description: string | null;
  time: string | null;
  thumbnail_url: string | null;
  external_thumbnail_asset_id?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaCarouselSlide {
  id: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryMedia {
  id: string;
  gallery_id: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price_cents: number | null;
  inventory_count: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  is_featured: boolean;
  is_active: boolean;
  stripe_product_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  product_images?: { image_url: string; display_order: number }[];
  product_variants?: ProductVariant[];
}

export interface BookingContentSection {
  id: string;
  image_url: string | null;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AboutContent {
  id: string;
  bio_text: string;
  created_at: string;
  updated_at: string;
}

export interface AboutPhoto {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface AboutTimelineItem {
  id: string;
  year: string;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  artist_name: string;
  member_1_name: string | null;
  member_2_name: string | null;
  hero_media_type: string | null;
  hero_media_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  booking_phone: string | null;
  booking_email: string | null;
  created_at: string;
  updated_at: string;
}
