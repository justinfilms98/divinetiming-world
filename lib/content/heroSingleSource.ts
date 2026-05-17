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
