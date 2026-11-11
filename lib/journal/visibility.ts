/**
 * Request-time Journal visibility for proxy.ts. The root loading.tsx streams the page shell with
 * HTTP 200 before a page can call notFound(), so Journal URLs are decided here, before rendering
 * starts, for visitors and crawlers to get a genuine 404.
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

type Fetch = typeof fetch;

async function publicQuery(path: string, config: PublicDbConfig, fetchImpl: Fetch): Promise<unknown[] | null> {
  if (!config.url || !config.anonKey) return null;
  try {
    const res = await fetchImpl(`${config.url}/rest/v1/${path}`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as unknown;
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

/**
 * The launch switch, asked with the public key. Fails closed: if it can't be read (switch row
 * missing, database unreachable) the Journal is treated as off.
 */
export async function isJournalPublicViaRest(config: PublicDbConfig, fetchImpl: Fetch = fetch): Promise<boolean> {
  const rows = await publicQuery('journal_settings?select=public_enabled&limit=1', config, fetchImpl);
  return (rows?.[0] as { public_enabled?: unknown } | undefined)?.public_enabled === true;
}

/**
 * True when a visitor may open this episode (published or coming soon, with the Journal on), asked
 * with the public key so the database's own rules decide. A malformed slug is never public. If the
 * database can't be reached the page renders and applies the same rules itself.
 */
export async function isPublicJournalSlug(slug: string, config: PublicDbConfig, fetchImpl: Fetch = fetch): Promise<boolean> {
  if (!slug || slug.length > 80 || !SLUG.test(slug)) return false;
  if (!config.url || !config.anonKey) return true;
  const rows = await publicQuery(
    `journal_episodes?select=slug&slug=eq.${encodeURIComponent(slug)}&status=in.(published,coming_soon)&limit=1`,
    config,
    fetchImpl
  );
  return rows === null ? true : rows.length > 0;
}

/** What the proxy does with a Journal path: serve it, or answer with the site's 404 page. */
export async function journalGateDecision(
  pathname: string,
  config: PublicDbConfig,
  fetchImpl: Fetch = fetch
): Promise<'next' | 'not_found'> {
  if (!(await isJournalPublicViaRest(config, fetchImpl))) return 'not_found';
  if (pathname === '/journal' || pathname === '/journal/') return 'next';
  const slug = journalSlugFromPath(pathname);
  if (slug === null) return 'not_found';
  return (await isPublicJournalSlug(slug, config, fetchImpl)) ? 'next' : 'not_found';
}

/** Unmatched path the proxy rewrites hidden Journal URLs to, so Next serves the site's 404 page with status 404. */
export const JOURNAL_NOT_FOUND_PATH = '/journal-episode-not-found';
