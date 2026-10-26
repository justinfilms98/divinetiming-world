import type { MediaPageVideo } from '@/lib/content/shared';

export interface LibraryVideoRow {
  id: string;
  name?: string | null;
  preview_url?: string | null;
  thumbnail_url?: string | null;
  mime_type?: string | null;
  orientation?: string | null;
  alt_text?: string | null;
}

export interface HeroRefRow {
  media_url?: string | null;
  media_storage_path?: string | null;
  external_media_asset_id?: string | null;
  hero_slots?: unknown;
}

const IMAGE_URL = /\.(avif|webp|png|jpe?g|gif)(\?|$)/i;

/** "hero_1-final.mp4" → "Hero 1 final". Used only when no editorial title exists. */
export function humanizeFileName(name: string): string {
  const base = name.replace(/\.[a-z0-9]{2,4}$/i, '').replace(/^\d{10,}-/, '');
  const words = base.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Video';
}

function normalizedName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase().replace(/[_\s]+/g, ' ');
}

function heroReferences(heroes: HeroRefRow[]) {
  const urls = new Set<string>();
  const assetIds = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) urls.add(value.trim());
  };
  for (const hero of heroes) {
    add(hero.media_url);
    add(hero.media_storage_path);
    if (hero.external_media_asset_id) assetIds.add(hero.external_media_asset_id);
    if (Array.isArray(hero.hero_slots)) {
      for (const slot of hero.hero_slots as Record<string, unknown>[]) {
        add(slot?.video_url);
        add(slot?.video_storage_path);
      }
    }
  }
  return { urls, assetIds };
}

function isHeroUrl(url: string, heroUrls: Set<string>): boolean {
  for (const ref of heroUrls) {
    if (url === ref || url.endsWith(`/${ref}`)) return true;
  }
  return false;
}

/**
 * Hero placements must never leak into the public video library. Hero clips are often
 * uploaded several times under the same file name, so any library row sharing a name with
 * a hero-placed asset is treated as the same footage. Remaining duplicates (same name) collapse
 * to the newest row (rows arrive newest first).
 */
export function selectLibraryVideos(rows: LibraryVideoRow[], heroes: HeroRefRow[]): MediaPageVideo[] {
  const { urls, assetIds } = heroReferences(heroes);
  const videos = rows.filter((r) => (r.mime_type || '').toLowerCase().startsWith('video/') && r.preview_url);

  const heroNames = new Set(
    videos
      .filter((r) => assetIds.has(r.id) || isHeroUrl(r.preview_url!.trim(), urls))
      .map((r) => normalizedName(r.name))
      .filter(Boolean)
  );

  const seen = new Set<string>();
  const out: MediaPageVideo[] = [];
  for (const r of videos) {
    const url = r.preview_url!.trim();
    const key = normalizedName(r.name) || url;
    if (assetIds.has(r.id) || isHeroUrl(url, urls) || heroNames.has(key) || seen.has(key)) continue;
    seen.add(key);
    // Never use the video file itself as an <img> thumbnail; that renders as a broken image.
    const thumb = r.thumbnail_url && IMAGE_URL.test(r.thumbnail_url) ? r.thumbnail_url.trim() : null;
    out.push({
      id: `lib-${r.id}`,
      title: r.alt_text?.trim() || humanizeFileName(r.name || ''),
      video_url: url,
      thumbnail_url: thumb,
      resolved_thumbnail_url: thumb ?? '',
      caption: null,
      is_vertical: r.orientation === 'portrait',
    });
  }
  return out;
}
