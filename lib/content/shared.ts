/**
 * Content shared utilities and types — safe for Client and Server.
 * Do not import this from modules that use createClient (server) or cookies.
 */

import { normalizeHeroEmbed } from '@/lib/embed';
import type {
  PageSettings,
  HeroSection,
  HeroCarouselSlide,
  Event,
  Gallery,
  GalleryMedia,
  Product,
  BookingContentSection,
  HeroSlot,
  HeroSlotIndex,
} from '@/lib/types/content';

export type { PageSettings, HeroSection, HeroCarouselSlide, Event, Gallery, GalleryMedia, Product, BookingContentSection, HeroSlot, HeroSlotIndex };

/**
 * Normalize hero_slots for save (max 3, slot_index 1–3 by position, overlay 0–0.7, embed YouTube/Vimeo only).
 * Use in admin UI before submit and in API route for server enforcement.
 * Returns slots or { error } if an embed slot has invalid input.
 */
export function normalizeHeroSlots(raw: unknown): HeroSlot[] | { error: string } {
  if (!Array.isArray(raw)) return [];
  const out: HeroSlot[] = [];
  for (let i = 0; i < Math.min(raw.length, 3); i++) {
    const r = raw[i];
    if (!r || typeof r !== 'object') continue;
    const obj = r as Record<string, unknown>;
    const media_type = (obj.media_type as HeroSlot['media_type']) ?? 'image';
    const slot_index = (i + 1) as HeroSlotIndex;
    let overlay = typeof obj.overlay_opacity === 'number' ? obj.overlay_opacity : Number(obj.overlay_opacity);
    if (Number.isNaN(overlay)) overlay = 0.4;
    overlay = Math.max(0, Math.min(0.7, overlay));
    const enabled = obj.enabled !== false;

    if (media_type === 'embed') {
      const embedInput = [obj.embed_url, obj.embed_id].find((v) => v != null && String(v).trim()) as string | undefined;
      const trimmed = embedInput ? String(embedInput).trim() : '';
      if (trimmed) {
        const norm = normalizeHeroEmbed(trimmed);
        if (!norm) return { error: 'Invalid embed: use a valid YouTube or Vimeo URL/ID' };
        out.push({
          slot_index,
          enabled,
          media_type: 'embed',
          image_storage_path: null,
          image_url: null,
          video_storage_path: null,
          poster_storage_path: null,
          embed_provider: norm.provider,
          embed_id: norm.id,
          embed_url: norm.embed_url,
          overlay_opacity: overlay,
        });
      } else {
        out.push({
          slot_index,
          enabled,
          media_type: 'embed',
          image_storage_path: null,
          image_url: null,
          video_storage_path: null,
          poster_storage_path: null,
          embed_provider: null,
          embed_id: null,
          embed_url: null,
          overlay_opacity: overlay,
        });
      }
    } else {
      out.push({
        slot_index,
        enabled,
        media_type: media_type === 'video' ? 'video' : 'image',
        image_storage_path: (obj.image_storage_path as string) ?? null,
        image_url: (obj.image_url as string) ?? null,
        video_storage_path: (obj.video_storage_path as string) ?? null,
        poster_storage_path: (obj.poster_storage_path as string) ?? null,
        embed_provider: null,
        embed_id: null,
        embed_url: null,
        overlay_opacity: overlay,
      });
    }
  }
  return out;
}

/** Page slugs for content lookup */
export const PAGE_SLUGS = ['home', 'events', 'media', 'shop', 'booking', 'about'] as const;

const YOUTUBE_ID_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)?([a-zA-Z0-9_-]{11})$/;

/** Extract YouTube video ID from URL or return the string if it's already an 11-char ID */
export function parseYouTubeId(source: string): string | null {
  const trimmed = source.trim();
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  const m = trimmed.match(YOUTUBE_ID_REGEX);
  return m ? m[1]! : null;
}

/** Video with resolved thumbnail for media page (client receives this from server) */
export interface MediaPageVideo {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  is_vertical?: boolean;
  resolved_thumbnail_url: string;
}

/** Gallery for hub: cover only, no media items (client receives this from server) */
export type GalleryForHub = Gallery & { resolved_cover_url: string | null; media_count: number };
