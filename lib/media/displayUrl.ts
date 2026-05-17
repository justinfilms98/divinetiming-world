/**
 * Client-safe URL parsing for display and placeholder decisions.
 * Use when you have a raw URL and need to know if it's valid or legacy.
 * For full resolution (external_asset_id → URL) use server-only resolveMediaUrl.
 */

export interface DisplayUrlResult {
  url?: string;
  isLegacy: boolean;
  isValid: boolean;
}

const UPLOADCARE_HOST = 'uploadcare';

/**
 * Parse a display URL for validity and legacy detection.
 * Does not throw; never exposes secrets.
 */
export function parseDisplayUrl(url: string | null | undefined): DisplayUrlResult {
  if (url == null || typeof url !== 'string') {
    return { isLegacy: false, isValid: false };
  }
  const trimmed = url.trim();
  if (!trimmed) return { isLegacy: false, isValid: false };
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return { isLegacy: false, isValid: false };
  }
  const isLegacy = trimmed.toLowerCase().includes(UPLOADCARE_HOST);
  return { url: trimmed, isLegacy, isValid: true };
}
