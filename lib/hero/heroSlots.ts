/**
 * Homepage hero slots (hero_sections.hero_slots JSONB): admin slot state and public resolution.
 * Client- and server-safe (no Supabase client, no cookies).
 *
 * Stored arrays are positional: entry N-1 is slot N. An emptied slot is kept as a disabled
 * placeholder so the slots after it never shift into its place.
 */

import type { HeroSlot, HeroSlotIndex, HeroSlotResolved } from '@/lib/types/content';
import { resolveHeroSlotImageUrl, resolveHeroSlotPosterUrl, resolveHeroSlotVideoUrl } from '@/lib/storageUrls';

export const HERO_SLOT_COUNT = 3;

export function emptyHeroSlot(slotIndex: HeroSlotIndex): HeroSlot {
  return {
    slot_index: slotIndex,
    enabled: false,
    media_type: 'image',
    image_storage_path: null,
    image_url: null,
    video_storage_path: null,
    video_url: null,
    poster_storage_path: null,
    embed_provider: null,
    embed_id: null,
    embed_url: null,
    overlay_opacity: null,
  };
}

/** The media a slot points at, whether or not it is switched on. */
export function heroSlotMediaUrl(slot: HeroSlot | null | undefined): string | null {
  if (!slot) return null;
  if (slot.media_type === 'video') {
    return resolveHeroSlotVideoUrl(slot.video_storage_path) ?? (slot.video_url?.trim() || null);
  }
  if (slot.media_type === 'image') {
    return resolveHeroSlotImageUrl(slot.image_storage_path) ?? (slot.image_url?.trim() || null);
  }
  if (slot.media_type === 'embed') return slot.embed_url?.trim() || null;
  return null;
}

export type HeroSlotState =
  | { kind: 'active'; url: string; mediaType: HeroSlot['media_type'] }
  /** Switched off but still referencing media (older "Remove" behaviour). Not shown publicly. */
  | { kind: 'off'; url: string; mediaType: HeroSlot['media_type'] }
  | { kind: 'empty' };

export function heroSlotState(slot: HeroSlot | null | undefined): HeroSlotState {
  const url = heroSlotMediaUrl(slot);
  if (!slot || !url) return { kind: 'empty' };
  return slot.enabled === false
    ? { kind: 'off', url, mediaType: slot.media_type }
    : { kind: 'active', url, mediaType: slot.media_type };
}

/** Slot N (1–3), matched by slot_index first so an older compacted array still maps correctly. */
export function heroSlotAt(slots: (HeroSlot | null)[] | null | undefined, slotNum: number): HeroSlot | null {
  if (!Array.isArray(slots)) return null;
  const byIndex = slots.find((s) => s && s.slot_index === slotNum);
  if (byIndex) return byIndex;
  const byPosition = slots[slotNum - 1];
  return byPosition && byPosition.slot_index == null ? byPosition : null;
}

/** Positional copy of `slots` with slot N replaced; gaps before N become empty placeholders. */
export function withHeroSlot(
  slots: (HeroSlot | null)[] | null | undefined,
  slotNum: number,
  slot: HeroSlot
): HeroSlot[] {
  const existingCount = Array.isArray(slots)
    ? Math.max(0, ...slots.map((s, i) => (s ? (s.slot_index ?? i + 1) : 0)))
    : 0;
  const length = Math.min(HERO_SLOT_COUNT, Math.max(slotNum, existingCount));
  const out: HeroSlot[] = [];
  for (let n = 1; n <= length; n++) {
    const idx = n as HeroSlotIndex;
    out.push(n === slotNum ? { ...slot, slot_index: idx } : (heroSlotAt(slots, n) ?? emptyHeroSlot(idx)));
  }
  return out;
}

/** Empties slot N: media references cleared and switched off. The file itself stays in storage. */
export function clearHeroSlot(slots: (HeroSlot | null)[] | null | undefined, slotNum: number): HeroSlot[] {
  return withHeroSlot(slots, slotNum, emptyHeroSlot(slotNum as HeroSlotIndex));
}

/** Count of slots that will actually appear on the homepage. */
export function activeHeroSlotCount(slots: (HeroSlot | null)[] | null | undefined): number {
  let n = 0;
  for (let i = 1; i <= HERO_SLOT_COUNT; i++) if (heroSlotState(heroSlotAt(slots, i)).kind === 'active') n++;
  return n;
}

type StoredSlot = HeroSlot & { type?: string; youtube_id?: string | null };

/** Public render: switched-on slots with media only (max 3). Supports Phase 9.1 and legacy shapes. */
export function resolveHeroSlots(raw: unknown): HeroSlotResolved[] | null {
  if (raw == null) return null;
  let arr: (StoredSlot | null)[];
  if (Array.isArray(raw)) {
    arr = raw.slice(0, HERO_SLOT_COUNT) as (StoredSlot | null)[];
  } else if (typeof raw === 'object') {
    arr = [];
    for (let i = 0; i < HERO_SLOT_COUNT; i++) {
      const slot = (raw as Record<string, unknown>)[i] ?? (raw as Record<string, unknown>)[`slot_${i + 1}`];
      if (slot != null && typeof slot === 'object') arr.push(slot as StoredSlot);
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
    if (s.enabled === false) continue;

    if (s.media_type === 'image' || s.type === 'image') {
      const resolved_image_url = resolveHeroSlotImageUrl(s.image_storage_path) ?? s.image_url ?? null;
      if (resolved_image_url) {
        resolved.push({ slot_index: slotIndex, enabled: true, media_type: 'image', resolved_image_url, overlay_opacity: opacity });
      }
    } else if (s.media_type === 'video') {
      const directUrl = s.video_url;
      const resolved_video_url =
        resolveHeroSlotVideoUrl(s.video_storage_path) ??
        (typeof directUrl === 'string' && directUrl.trim() ? directUrl.trim() : null);
      if (resolved_video_url) {
        resolved.push({
          slot_index: slotIndex,
          enabled: true,
          media_type: 'video',
          resolved_video_url,
          resolved_poster_url: resolveHeroSlotPosterUrl(s.poster_storage_path) ?? undefined,
          overlay_opacity: opacity,
        });
      }
    } else if (s.media_type === 'embed' || s.type === 'youtube') {
      const embedUrl =
        s.embed_url ??
        (s.embed_provider === 'youtube' && s.embed_id ? `https://www.youtube.com/embed/${s.embed_id}` : null) ??
        (s.embed_provider === 'vimeo' && s.embed_id ? `https://player.vimeo.com/video/${s.embed_id}` : null);
      const resolved_embed_url = embedUrl ?? (s.youtube_id ? `https://www.youtube.com/embed/${s.youtube_id}` : null);
      if (resolved_embed_url) {
        resolved.push({ slot_index: slotIndex, enabled: true, media_type: 'embed', resolved_embed_url, overlay_opacity: opacity });
      }
    }
  }
  return resolved.length ? resolved : null;
}
