/**
 * Builds the hero_sections update for POST /api/admin/hero.
 *
 * Only fields present in the request are written, so a slot-only save can never reset the logo,
 * overlay, copy or CTA. Defaults apply only when a page's hero row is first created.
 */

import { validateHeroLogoUrl } from '@/lib/hero-validation';
import { normalizeHeroSlots } from '@/lib/content/shared';

export const HERO_INSERT_DEFAULTS = {
  media_type: 'default',
  overlay_opacity: 0.4,
  animation_type: 'warp',
  animation_enabled: true,
} as const;

/** Canonical column → accepted request keys (first present wins). Nested `hero` payloads use camelCase aliases. */
const FIELD_KEYS: Record<string, readonly string[]> = {
  media_type: ['type', 'media_type'],
  external_media_asset_id: ['external_media_asset_id'],
  media_url: ['url', 'media_url'],
  media_storage_path: ['media_storage_path'],
  hero_logo_url: ['hero_logo_url', 'heroLogoUrl'],
  hero_logo_storage_path: ['hero_logo_storage_path'],
  overlay_opacity: ['overlayOpacity', 'overlay_opacity'],
  label_text: ['label_text', 'labelText'],
  headline: ['headline'],
  subtext: ['subtext'],
  cta_text: ['ctaLabel', 'cta_text'],
  cta_url: ['ctaHref', 'cta_url'],
  animation_type: ['animation_type'],
  animation_enabled: ['animation_enabled'],
  hero_slots: ['hero_slots'],
};

const NULLABLE_TEXT = [
  'external_media_asset_id',
  'media_url',
  'media_storage_path',
  'hero_logo_storage_path',
  'label_text',
  'headline',
  'subtext',
  'cta_text',
  'cta_url',
] as const;

export type HeroUpdateResult =
  | { ok: true; slug: string; update: Record<string, unknown> }
  | { ok: false; error: string };

export interface ExistingHeroCta {
  cta_text?: string | null;
  cta_url?: string | null;
}

function pick(src: Record<string, unknown>, keys: readonly string[]): { present: boolean; value: unknown } {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(src, k) && src[k] !== undefined) return { present: true, value: src[k] };
  }
  return { present: false, value: undefined };
}

/** If a CTA URL is set, the label must be set too. */
export function validateCta(cta_text: unknown, cta_url: unknown): string | null {
  const url = typeof cta_url === 'string' ? cta_url.trim() : '';
  if (!url) return null;
  const text = typeof cta_text === 'string' ? cta_text.trim() : '';
  return text ? null : 'CTA label is required when CTA URL is set.';
}

export function heroSlugFromBody(body: Record<string, unknown>): string {
  const raw = body.page_slug ?? body.pageKey;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : 'home';
}

/**
 * @param body    Parsed request JSON: flat fields, or `{ pageKey, hero: { ... } }`.
 * @param existing The current row's CTA, so a request changing only one CTA field is validated
 *                 against the other's saved value.
 */
export function buildHeroUpdate(body: unknown, existing?: ExistingHeroCta | null): HeroUpdateResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Invalid request body' };
  const root = body as Record<string, unknown>;
  const slug = heroSlugFromBody(root);
  const src =
    root.hero && typeof root.hero === 'object' && !Array.isArray(root.hero)
      ? (root.hero as Record<string, unknown>)
      : root;

  const update: Record<string, unknown> = {};

  for (const col of NULLABLE_TEXT) {
    const { present, value } = pick(src, FIELD_KEYS[col]!);
    if (!present) continue;
    if (value !== null && typeof value !== 'string') return { ok: false, error: `${col} must be text or null` };
    update[col] = value;
  }

  const mediaType = pick(src, FIELD_KEYS.media_type!);
  if (mediaType.present) update.media_type = typeof mediaType.value === 'string' && mediaType.value ? mediaType.value : 'default';

  const logo = pick(src, FIELD_KEYS.hero_logo_url!);
  if (logo.present) {
    const valid = validateHeroLogoUrl(logo.value);
    if (valid === undefined) return { ok: false, error: 'hero_logo_url must be null or a valid http(s) URL' };
    update.hero_logo_url = valid;
  }

  const overlay = pick(src, FIELD_KEYS.overlay_opacity!);
  if (overlay.present) {
    if (overlay.value === null) {
      update.overlay_opacity = HERO_INSERT_DEFAULTS.overlay_opacity;
    } else {
      const raw = Number(overlay.value);
      if (!Number.isFinite(raw)) return { ok: false, error: 'overlay_opacity must be a number' };
      const fraction = raw > 1 ? raw / 100 : raw;
      update.overlay_opacity = Math.min(1, Math.max(0, fraction));
    }
  }

  const animType = pick(src, FIELD_KEYS.animation_type!);
  if (animType.present) update.animation_type = typeof animType.value === 'string' && animType.value ? animType.value : 'warp';
  const animOn = pick(src, FIELD_KEYS.animation_enabled!);
  if (animOn.present) update.animation_enabled = animOn.value !== false;

  const slots = pick(src, FIELD_KEYS.hero_slots!);
  if (slots.present) {
    if (slots.value !== null && !Array.isArray(slots.value)) return { ok: false, error: 'hero_slots must be a list' };
    const result = normalizeHeroSlots(slots.value);
    if (!Array.isArray(result)) return { ok: false, error: result.error };
    update.hero_slots = result;
  }

  if ('cta_text' in update || 'cta_url' in update) {
    const text = 'cta_text' in update ? update.cta_text : existing?.cta_text;
    const url = 'cta_url' in update ? update.cta_url : existing?.cta_url;
    const ctaError = validateCta(text, url);
    if (ctaError) return { ok: false, error: ctaError };
  }

  update.updated_at = new Date().toISOString();
  return { ok: true, slug, update };
}
