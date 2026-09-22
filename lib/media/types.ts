/** Central media-library asset (external_media_assets) used across CMS pickers. */

export const MEDIA_USAGE_TYPES = [
  'internal',
  'public',
  'gallery',
  'hero',
  'press',
  'product',
] as const;

export type MediaUsageType = (typeof MEDIA_USAGE_TYPES)[number];

export const MEDIA_ORIENTATIONS = ['landscape', 'portrait', 'square', 'unknown'] as const;

export type MediaOrientation = (typeof MEDIA_ORIENTATIONS)[number];

/** Suggested category labels — free text in the DB, closed list in the admin UI. */
export const MEDIA_CATEGORY_SUGGESTIONS = [
  'Live',
  'Studio',
  'Press',
  'Logo',
  'Product',
  'Hero',
  'Behind the scenes',
] as const;

/** Usage values that may appear on public pages (anon SELECT + public fetchers). */
export const PUBLIC_MEDIA_USAGE_TYPES: readonly MediaUsageType[] = [
  'public',
  'gallery',
  'hero',
  'press',
  'product',
];

export interface MediaLibraryAsset {
  id: string;
  provider?: string | null;
  preview_url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  name: string | null;
  size_bytes?: number | null;
  created_at?: string;
  updated_at?: string;
  width?: number | null;
  height?: number | null;
  alt_text?: string | null;
  photographer?: string | null;
  location?: string | null;
  captured_at?: string | null;
  orientation?: MediaOrientation | null;
  is_featured?: boolean;
  usage_type?: MediaUsageType;
  is_archived?: boolean;
  category?: string | null;
  tags?: string[];
}

export function isMediaUsageType(value: unknown): value is MediaUsageType {
  return typeof value === 'string' && (MEDIA_USAGE_TYPES as readonly string[]).includes(value);
}

export function isMediaOrientation(value: unknown): value is MediaOrientation {
  return typeof value === 'string' && (MEDIA_ORIENTATIONS as readonly string[]).includes(value);
}

export function orientationFromDimensions(
  width?: number | null,
  height?: number | null
): MediaOrientation {
  if (width == null || height == null || width <= 0 || height <= 0) return 'unknown';
  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}

export function parseMediaTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((t) => String(t).trim()).filter(Boolean))];
  }
  if (typeof value === 'string') {
    return [
      ...new Set(
        value
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ];
  }
  return [];
}

export function hasUsableAltText(alt: string | null | undefined): boolean {
  return Boolean(alt && alt.trim());
}
