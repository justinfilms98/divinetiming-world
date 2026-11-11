import { getPlatformLinks, type PlatformLinkOverrides } from '@/lib/platformLinks';
import { checkSocialUrl, instagramHandle, SOCIAL_HOSTS } from '@/lib/site/externalLinks';

export type FooterIconId = 'spotify' | 'youtube' | 'instagram' | 'soundcloud' | 'beatport';

export interface FooterLink {
  key: string;
  icon: FooterIconId;
  label: string;
  href: string;
  /** Shown next to the icon (Instagram accounts). */
  handle?: string;
}

export interface FooterLinkSettings extends PlatformLinkOverrides {
  instagram_secondary_url?: string | null;
  soundcloud_url?: string | null;
  beatport_url?: string | null;
}

function validSocial(raw: string | null | undefined, hosts: readonly string[]): string | null {
  const checked = checkSocialUrl(raw, hosts, 'link');
  return checked.ok ? checked.value : null;
}

/**
 * Footer social row: Spotify and YouTube as before, then both Instagram accounts (with their
 * handles), SoundCloud and Beatport. Links added in D2-B appear only once they're configured.
 */
export function getFooterLinks(settings?: FooterLinkSettings | null): FooterLink[] {
  const platform = getPlatformLinks(settings ?? undefined);
  const byId = new Map(platform.map((link) => [link.id, link]));
  const links: FooterLink[] = [];

  for (const id of ['spotify', 'youtube'] as const) {
    const link = byId.get(id);
    if (link) links.push({ key: id, icon: id, label: link.label, href: link.href });
  }

  const primary = byId.get('instagram');
  const primaryHandle = instagramHandle(primary?.href);
  if (primary) {
    links.push({
      key: 'instagram',
      icon: 'instagram',
      label: primaryHandle ? `Instagram ${primaryHandle}` : 'Instagram',
      href: primary.href,
      handle: primaryHandle ?? undefined,
    });
  }

  const secondary = validSocial(settings?.instagram_secondary_url, SOCIAL_HOSTS.instagram);
  const secondaryHandle = instagramHandle(secondary);
  if (secondary && !(secondaryHandle && secondaryHandle === primaryHandle)) {
    links.push({
      key: 'instagram2',
      icon: 'instagram',
      label: secondaryHandle ? `Instagram ${secondaryHandle}` : 'Instagram',
      href: secondary,
      handle: secondaryHandle ?? undefined,
    });
  }

  const soundcloud = validSocial(settings?.soundcloud_url, SOCIAL_HOSTS.soundcloud);
  if (soundcloud) links.push({ key: 'soundcloud', icon: 'soundcloud', label: 'SoundCloud', href: soundcloud });

  const beatport = validSocial(settings?.beatport_url, SOCIAL_HOSTS.beatport);
  if (beatport) links.push({ key: 'beatport', icon: 'beatport', label: 'Beatport', href: beatport });

  return links;
}

/**
 * Splits the links, in order, into at most two balanced rows (six links → 3 + 3), so no link is
 * left alone on a row of its own. Three or fewer links stay on one row.
 */
export function footerLinkRows<T>(links: readonly T[]): T[][] {
  if (links.length === 0) return [];
  if (links.length <= 3) return [[...links]];
  const firstRow = Math.ceil(links.length / 2);
  return [links.slice(0, firstRow), links.slice(firstRow)];
}
