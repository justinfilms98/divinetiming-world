/**
 * Web-sized copies of oversized original photos, keyed by the original's storage path.
 *
 * Originals stay untouched in storage and in the database, and remain the target of the Media
 * Library's "copy URL". Display code swaps in the copy, so the image optimizer never fetches a
 * 30+ MB file. Copy names carry a content hash, so each URL is immutable (never overwritten).
 * The host is kept, so a staging URL maps to the staging copy and production to production.
 */

const COPIES: Record<string, string> = {
  // 4672x7008, 35.4 MB -> 3200x4800, 2.7 MB (JPEG q88, sRGB profile kept, location data removed)
  'library/1773117243870-Photo784_Original.jpg': 'library/web/1773117243870-Photo784_Original-web3200-72a3a441af.jpg',
  // 4672x7008, 31.0 MB -> 3200x4800, 2.0 MB
  'library/1773117233724-Photo506_Original.jpg': 'library/web/1773117233724-Photo506_Original-web3200-97054f4672.jpg',
};

const PUBLIC_MEDIA = '/storage/v1/object/public/media/';

/** The web copy's URL for an original that has one, else null. */
export function webCopyFor(url: string | null | undefined): string | null {
  if (!url) return null;
  const at = url.indexOf(PUBLIC_MEDIA);
  if (at < 0) return null;
  const path = url.slice(at + PUBLIC_MEDIA.length).split(/[?#]/)[0]!;
  const copy = COPIES[path];
  return copy ? `${url.slice(0, at + PUBLIC_MEDIA.length)}${copy}` : null;
}

/** URL to display: the web copy when one exists, otherwise the URL unchanged. */
export function displayImageUrl<T extends string | null | undefined>(url: T): T {
  return (webCopyFor(url) as T | null) ?? url;
}

/** Storage paths of all web copies (for release checks: each must exist before code that uses it ships). */
export function webCopyPaths(): { original: string; copy: string }[] {
  return Object.entries(COPIES).map(([original, copy]) => ({ original, copy }));
}
