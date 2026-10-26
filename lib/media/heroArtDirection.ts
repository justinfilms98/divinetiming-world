/**
 * Per-asset art direction for page heroes: where to anchor the crop on phones vs larger
 * screens, and whether a portrait photo should use the split layout on wide screens
 * instead of being cropped into a shallow banner.
 *
 * Keyed by a stable fragment of the source URL (storage path). Replacing an image in admin
 * falls back to DEFAULT_ART_DIRECTION, so a new photo is never framed by old settings.
 * Admin-editable focal points (hero_sections columns) will take precedence once added.
 */
export interface HeroArtDirection {
  /** CSS object-position on phones (< 768px). */
  mobile: string;
  /** CSS object-position at 768px and wider. */
  desktop: string;
  /** Portrait sources: text panel + uncropped-feeling portrait panel at md+. */
  desktopLayout?: 'cover' | 'split';
  /** Move the title off the faces at md+ when centred text would sit on a face. */
  desktopText?: 'center' | 'bottom-left';
}

export const DEFAULT_ART_DIRECTION: HeroArtDirection = {
  // Faces usually sit in the upper third of artist photography.
  mobile: '50% 30%',
  desktop: '50% 30%',
};

const BY_SOURCE: Record<string, HeroArtDirection> = {
  // Portrait 2653×3643: faces between ~22–47% height. Too tall for any banner on desktop.
  'hero/shop.jpg': { mobile: '50% 30%', desktop: '50% 28%', desktopLayout: 'split' },
  // Landscape 5120×3406: faces span ~12–78% height at different levels; centred text lands
  // on the left face at desktop widths, so the title moves to the lower-left corner.
  'hero/media.jpg': { mobile: '52% 42%', desktop: '50% 40%', desktopText: 'bottom-left' },
  // Landscape 5120×3872 (also used by Contact and Journey): heads begin ~4% from the top.
  'hero/booking.jpg': { mobile: '50% 8%', desktop: '50% 6%' },
  'Pro_shoot_2.jpg': { mobile: '50% 8%', desktop: '50% 6%' },
  // Landscape 3420×2512 crowd + neon sign (sign at ~16–25% height): keep the whole sign
  // even in the shallowest (1920px) banner.
  'hero/events.jpg': { mobile: '50% 40%', desktop: '50% 22%' },
};

export function heroArtDirectionFor(url: string | null | undefined): HeroArtDirection {
  if (!url) return DEFAULT_ART_DIRECTION;
  for (const [fragment, direction] of Object.entries(BY_SOURCE)) {
    if (url.includes(fragment)) return direction;
  }
  return DEFAULT_ART_DIRECTION;
}
