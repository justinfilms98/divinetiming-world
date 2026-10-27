/**
 * Web renditions of homepage hero videos, keyed by the original's storage path.
 * Originals stay untouched in storage and in the database; a slide whose URL has an
 * entry here plays the rendition instead. File names carry a content hash, so each URL
 * is immutable: a re-encode gets a new name, never an overwrite.
 */

const STORAGE_BASE = 'https://lokewuvbrrvmlgdwivoa.supabase.co/storage/v1/object/public/media/';
const DIR = 'hero/optimized/';

export interface HeroRendition {
  /** ≤1920 px wide, ~5.5 Mbit/s. */
  desktop: string;
  /** ≤1280 px wide, ~2.6 Mbit/s. */
  mobile: string;
  /** First frame of the clip, so the poster-to-video handoff is seamless. */
  poster: string;
  posterSmall: string;
}

const RENDITIONS: Record<string, { desktop: string; mobile: string; poster: string; posterSmall: string }> = {
  'library/1779483817012-hero_1.mp4': {
    desktop: 'hero-1-1080p-f1a49936b2.mp4',
    mobile: 'hero-1-720p-f3daf77e46.mp4',
    poster: 'hero-1-poster-1920-cc726b6709.webp',
    posterSmall: 'hero-1-poster-1280-cb295f18e2.webp',
  },
  'library/1779482521222-hero_2.mp4': {
    desktop: 'hero-2-1080p-e1c66eeca2.mp4',
    mobile: 'hero-2-720p-07832e3852.mp4',
    poster: 'hero-2-poster-1920-c0f78ee6be.webp',
    posterSmall: 'hero-2-poster-1280-5c9ccc9110.webp',
  },
  'library/1779482501628-hero_3.mp4': {
    desktop: 'hero-3-1080p-296e0ea290.mp4',
    mobile: 'hero-3-720p-65665b1b0d.mp4',
    poster: 'hero-3-poster-1920-0a6fd06590.webp',
    posterSmall: 'hero-3-poster-1280-7d2e53fafb.webp',
  },
};

export function heroRenditionFor(url: string | null | undefined): HeroRendition | null {
  if (!url) return null;
  const key = Object.keys(RENDITIONS).find((k) => url.split('?')[0].endsWith(k));
  if (!key) return null;
  const r = RENDITIONS[key];
  const at = (file: string) => `${STORAGE_BASE}${DIR}${file}`;
  return { desktop: at(r.desktop), mobile: at(r.mobile), poster: at(r.poster), posterSmall: at(r.posterSmall) };
}

/** `posters` = no video at all (Data Saver or 2G); the carousel cycles the still frames. */
export type HeroVariant = 'desktop' | 'mobile' | 'posters';

export interface HeroVariantEnv {
  viewportWidth: number;
  /** Network Information API (Chrome/Android only; Safari reports none of these). */
  saveData?: boolean;
  effectiveType?: string;
  /** Estimated downlink in Mbit/s. */
  downlink?: number;
}

// The phone rendition averages ~2.6 Mbit/s: below ~0.7 Mbit/s ("3g" and slower) even it can't
// play in real time, so the carousel shows still frames instead of a stalling video.
export function pickHeroVariant(env: HeroVariantEnv): HeroVariant {
  if (env.saveData || env.effectiveType === '3g' || env.effectiveType === '2g' || env.effectiveType === 'slow-2g') {
    return 'posters';
  }
  if (env.viewportWidth < 768) return 'mobile';
  if (typeof env.downlink === 'number' && env.downlink > 0 && env.downlink < 5) return 'mobile';
  return 'desktop';
}
