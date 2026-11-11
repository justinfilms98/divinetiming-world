/**
 * Request-time Journal visibility for proxy.ts. The root loading.tsx streams the page shell with
 * HTTP 200 before a page can call notFound(), so hidden episodes must be turned away here,
 * before rendering starts, for visitors and crawlers to get a genuine 404.
 */

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** "barcelona" for /journal/barcelona (one segment, optional trailing slash); otherwise null. */
export function journalSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/journal\/([^/]+)\/?$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]!);
  } catch {
    return '';
  }
}

export function isJournalPath(pathname: string): boolean {
  return pathname === '/journal' || pathname.startsWith('/journal/');
}

export interface PublicDbConfig {
  url: string | undefined;
  anonKey: string | undefined;
}

/**
 * True when a visitor may open this episode (published or coming soon), asked with the public key
 * so the database's own visibility rules decide. A malformed slug is never public. If the database
 * can't be reached the page is allowed to render and show its own not-found state, rather than
 * hiding a real episode.
 */
export async function isPublicJournalSlug(
  slug: string,
  config: PublicDbConfig,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  if (!slug || slug.length > 80 || !SLUG.test(slug)) return false;
  if (!config.url || !config.anonKey) return true;
  try {
    const res = await fetchImpl(
      `${config.url}/rest/v1/journal_episodes?select=slug&slug=eq.${encodeURIComponent(slug)}&status=in.(published,coming_soon)&limit=1`,
      { headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` }, cache: 'no-store' }
    );
    if (!res.ok) return true;
    const rows = (await res.json()) as unknown;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return true;
  }
}

/** Unmatched path the proxy rewrites hidden Journal URLs to, so Next serves the site's 404 page with status 404. */
export const JOURNAL_NOT_FOUND_PATH = '/journal-episode-not-found';
