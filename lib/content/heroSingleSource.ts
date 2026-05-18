/**
 * Phase C: Single hero surface — resolve one media URL + type from hero_slots or legacy.
 * Prefer first video, then first image; else legacy hero_sections media.
 */

import type { HeroSection, HeroSlotResolved } from '@/lib/types/content';

export interface HeroSingleSource {
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  posterUrl?: string | null;
}

export function getHeroSingleSource(hero: HeroSection | null): HeroSingleSource {
  if (!hero) return { mediaUrl: null, mediaType: null };

  const slots = hero.hero_slots;
  if (slots && slots.length > 0) {
    const firstVideo = slots.find((s): s is HeroSlotResolved & { resolved_video_url: string } =>
      s.media_type === 'video' && !!s.resolved_video_url
    );
    if (firstVideo?.resolved_video_url) {
      return {
        mediaUrl: firstVideo.resolved_video_url,
        mediaType: 'video',
        posterUrl: firstVideo.resolved_poster_url ?? undefined,
      };
    }
    const firstImage = slots.find((s): s is HeroSlotResolved & { resolved_image_url: string } =>
      s.media_type === 'image' && !!s.resolved_image_url
    );
    if (firstImage?.resolved_image_url) {
      return {
        mediaUrl: firstImage.resolved_image_url,
        mediaType: 'image',
      };
    }
  }

  const legacy = hero.mediaFinalUrl ?? null;
  const type = hero.media_type === 'video' || hero.media_type === 'image'
    ? hero.media_type
    : (legacy ? 'image' : null);
  return {
    mediaUrl: legacy,
    mediaType: type,
  };
}

/** Returns ALL resolved media slots for carousel use. Falls back to legacy single source as slot 0. */
export function getHeroAllSlots(hero: HeroSection | null): HeroSingleSource[] {
  if (!hero) return [];
  const slots = hero.hero_slots;
  if (slots && slots.length > 0) {
    const resolved: HeroSingleSource[] = [];
    for (const s of slots) {
      if (s.media_type === 'video' && s.resolved_video_url) {
        resolved.push({
          mediaUrl: s.resolved_video_url,
          mediaType: 'video',
          posterUrl: s.resolved_poster_url ?? undefined,
        });
      } else if (s.media_type === 'image' && s.resolved_image_url) {
        resolved.push({
          mediaUrl: s.resolved_image_url,
          mediaType: 'image',
        });
      } else if (s.media_type === 'embed' && s.resolved_embed_url) {
        resolved.push({
          mediaUrl: s.resolved_embed_url,
          mediaType: 'video',
        });
      }
    }
    if (resolved.length > 0) return resolved;
  }
  // Fall back to legacy single source
  const single = getHeroSingleSource(hero);
  if (single.mediaUrl) return [single];
  return [];
}
