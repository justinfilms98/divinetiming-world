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
  booking_about_title?: string | null;
  booking_about_body?: string | null;
  booking_about_asset_id?: string | null;
  booking_about_image_url?: string | null;
  booking_sponsors?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeroSection {
  id: string;
  page_slug: PageSlug;
  media_type: 'image' | 'video' | 'default';
  media_url: string | null;
  /** Supabase Storage path in bucket media; when set, mediaFinalUrl is built from this */
  media_storage_path?: string | null;
  external_media_asset_id?: string | null;
  /** PNG logo URL (legacy); fallback when hero_logo_storage_path is empty */
  hero_logo_url?: string | null;
  /** Supabase Storage path for hero logo in bucket media; when set, logoFinalUrl is built from this */
  hero_logo_storage_path?: string | null;
  overlay_opacity: number;
  /** Optional label above headline (e.g. ELECTRONIC DUO). Blank = do not render. */
  label_text?: string | null;
  headline: string | null;
  subtext: string | null;
  cta_text: string | null;
  cta_url: string | null;
  animation_type: 'warp' | 'clock' | 'none';
  animation_enabled: boolean;
  created_at: string;
  updated_at: string;
  /** Resolved URL for hero media: from storage path if set, else media_url */
  mediaFinalUrl?: string | null;
  /** Resolved URL for hero logo: from storage path if set, else hero_logo_url */
  logoFinalUrl?: string | null;
  /** Phase 9/9.1: up to 3 carousel slots. Null/empty = use legacy single hero. */
  hero_slots?: HeroSlotResolved[] | null;
}

/** Slot index 1–3 for hero carousel. */
export type HeroSlotIndex = 1 | 2 | 3;

/** One hero carousel slot (stored in hero_slots JSONB). Phase 9.1: image | video | embed. */
export interface HeroSlot {
  slot_index: HeroSlotIndex;
  enabled: boolean;
  media_type: 'image' | 'video' | 'embed';
  image_storage_path?: string | null;
  /** Fallback URL when image from library (no storage path). */
  image_url?: string | null;
  video_storage_path?: string | null;
  poster_storage_path?: string | null;
  embed_provider?: 'youtube' | 'vimeo' | null;
  embed_id?: string | null;
  embed_url?: string | null;
  overlay_opacity?: number | null;
}

/** Resolved slot for public render: resolved_* URLs from storage paths or embed_url. */
export interface HeroSlotResolved {
  slot_index: HeroSlotIndex;
  enabled: boolean;
  media_type: 'image' | 'video' | 'embed';
  resolved_image_url?: string | null;
  resolved_video_url?: string | null;
  resolved_poster_url?: string | null;
  resolved_embed_url?: string | null;
  overlay_opacity?: number | null;
}

/** Single slide for hero carousel. type=video with youtubeId uses YouTube embed; otherwise source is URL. */
export interface HeroCarouselSlide {
  type: 'video' | 'image';
  /** YouTube video ID (11 chars) when type=video and embed is YouTube; otherwise image or video URL */
  source: string;
  headline?: string | null;
  subtext?: string | null;
  cta?: { text: string; url: string } | null;
}

/** Content state: only 'published' appears on public pages. */
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface Event {
  id: string;
  slug?: string | null;
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
  /** draft = hidden; published = on site; archived = hidden, kept for history. */
  status?: ContentStatus;
  created_at: string;
  updated_at: string;
  /** Set by content layer when resolving thumbnails (storage path / external asset). */
  resolved_thumbnail_url?: string | null;
}

export interface Gallery {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  description: string | null;
  display_order: number;
  status?: ContentStatus;
  created_at: string;
  updated_at: string;
  external_cover_asset_id?: string | null;
  /** Set by content layer when resolving cover (URL or external asset). */
  resolved_cover_url?: string | null;
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
  url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  external_media_asset_id?: string | null;
  /** Set by content layer when resolving media URLs. */
  resolved_url?: string | null;
  resolved_thumbnail_url?: string | null;
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
  /** Optional short line under product name (e.g. "Limited run"). */
  subtitle?: string | null;
  description: string | null;
  price_cents: number;
  is_featured: boolean;
  is_active: boolean;
  /** Optional badge label: Limited, New, etc. Sold out derived from inventory. */
  badge?: string | null;
  /** draft = hidden from shop; published = visible; archived = hidden. */
  status?: ContentStatus;
  stripe_product_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  product_images?: { image_url: string; display_order: number }[];
  product_variants?: ProductVariant[];
}

export type BookingAlign = 'left' | 'right' | 'auto';
export type BookingAccent = 'star' | 'clock' | 'sunset' | null;

export interface BookingContentSection {
  id: string;
  image_url: string | null;
  title: string;
  description: string | null;
  display_order: number;
  align_preference?: BookingAlign | null;
  accent?: BookingAccent | null;
  created_at: string;
  updated_at: string;
}

export interface AboutContent {
  id: string;
  bio_text: string;
  bio_html?: string | null;
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
