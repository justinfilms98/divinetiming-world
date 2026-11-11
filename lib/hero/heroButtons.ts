import { checkCtaLabel, checkCtaUrl } from '@/lib/site/externalLinks';
import type { HomeSectionVisibility } from '@/lib/site/homeSections';

export interface HeroButton {
  text: string;
  url: string;
}

export const DEFAULT_PRIMARY_BUTTON: HeroButton = { text: 'Listen', url: '/music' };
export const DEFAULT_SECONDARY_BUTTON: HeroButton = { text: 'Join the tribe', url: '/#tribe' };

export interface HeroButtonFields {
  cta_text?: string | null;
  cta_url?: string | null;
  secondary_cta_text?: string | null;
  secondary_cta_url?: string | null;
}

function resolveButton(text: unknown, url: unknown, fallback: HeroButton): HeroButton {
  const label = checkCtaLabel(text);
  const link = checkCtaUrl(url);
  return {
    text: (label.ok && label.value) || fallback.text,
    url: (link.ok && link.value) || fallback.url,
  };
}

/** True when the link points at the homepage signup ("#tribe" or "/#tribe"). */
export function targetsTribe(url: string): boolean {
  return url === '#tribe' || url === '/#tribe';
}

/**
 * The two homepage hero buttons. Empty or invalid saved values fall back to the defaults, and a
 * button that would scroll to a hidden Tribe section isn't shown.
 */
export function resolveHeroButtons(
  hero: HeroButtonFields | null | undefined,
  sections?: Pick<HomeSectionVisibility, 'tribe'>
): { primary: HeroButton | null; secondary: HeroButton | null } {
  const tribeShown = sections?.tribe !== false;
  const primary = resolveButton(hero?.cta_text, hero?.cta_url, DEFAULT_PRIMARY_BUTTON);
  const secondary = resolveButton(hero?.secondary_cta_text, hero?.secondary_cta_url, DEFAULT_SECONDARY_BUTTON);
  return {
    primary: !tribeShown && targetsTribe(primary.url) ? null : primary,
    secondary: !tribeShown && targetsTribe(secondary.url) ? null : secondary,
  };
}
