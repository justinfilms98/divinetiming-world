import type { MediaLibraryAsset } from '@/lib/media/types';

/** Same limits as the logo uploader: transparent PNG, at most 2 MB, ideally 600 px wide or more. */
export const LOGO_MIME_TYPE = 'image/png';
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_MIN_WIDTH = 600;

type LogoCandidate = Pick<MediaLibraryAsset, 'mime_type' | 'preview_url'> &
  Partial<Pick<MediaLibraryAsset, 'size_bytes' | 'width' | 'is_archived'>>;

/**
 * Library images that can be reused as the home hero logo. Unknown size or width is allowed
 * (most library rows don't record dimensions); the editor warns once the image has loaded.
 */
export function isLogoCompatible(asset: LogoCandidate): boolean {
  if ((asset.mime_type || '').toLowerCase() !== LOGO_MIME_TYPE) return false;
  if (asset.is_archived) return false;
  if (!/^https:\/\//i.test(asset.preview_url || '')) return false;
  if (asset.size_bytes != null && asset.size_bytes > LOGO_MAX_BYTES) return false;
  if (asset.width != null && asset.width > 0 && asset.width < LOGO_MIN_WIDTH) return false;
  return true;
}

export interface HeroLogoFields {
  hero_logo_url?: string | null;
  hero_logo_storage_path?: string | null;
}

/**
 * Points the hero at a new logo address and nothing else. The storage path is cleared because
 * it takes precedence over the URL when the logo is displayed.
 */
export function withLogo<T extends HeroLogoFields>(hero: T, url: string): T {
  return { ...hero, hero_logo_url: url, hero_logo_storage_path: null };
}

/** True when the library item is the image the hero already uses. */
export function isCurrentLogo(asset: Pick<MediaLibraryAsset, 'preview_url'>, currentUrl: string | null | undefined): boolean {
  return !!currentUrl && asset.preview_url === currentUrl;
}
