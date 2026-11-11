export interface PublicNavItem {
  label: string;
  href: string;
  /** Also highlighted on pages below it (e.g. /journal/episode-3-barcelona). */
  matchChildren?: boolean;
}

/**
 * Order follows the brief's primary IA. JOURNAL joins the right-hand group once the Journal is public
 * (the server-side switch, passed down from the root layout).
 */
export function publicNavItems(journalEnabled: boolean): PublicNavItem[] {
  return [
    { label: 'MUSIC', href: '/music' },
    { label: 'EVENTS', href: '/events' },
    { label: 'JOURNEY', href: '/journey' },
    ...(journalEnabled ? [{ label: 'JOURNAL', href: '/journal', matchChildren: true }] : []),
    { label: 'MEDIA', href: '/media' },
    { label: 'SHOP', href: '/shop' },
    { label: 'BOOK', href: '/booking' },
  ];
}

/** Desktop bar: these many links sit left of the logo, the rest on the right. */
export const NAV_LEFT_COUNT = 3;

/** Exact match, or a page below the item when it opts in. "/journalism" never matches "/journal". */
export function isNavItemActive(item: PublicNavItem, pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === item.href) return true;
  return !!item.matchChildren && pathname.startsWith(`${item.href}/`);
}
