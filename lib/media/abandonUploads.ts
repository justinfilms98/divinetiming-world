/**
 * Narrow cleanup for uploads that reached storage but never registered in the library.
 * Path shape checks only — ownership requires a server-issued abandon ticket.
 */

/** Timestamped library object created by /api/admin/media/upload-path. */
const SESSION_LIBRARY_PATH =
  /^library\/(?:posters\/)?\d{10,}-[A-Za-z0-9._-]{1,140}$/;

export function isAbandonableUploadPath(path: string): boolean {
  if (typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.includes('\\') || trimmed.startsWith('/')) {
    return false;
  }
  return SESSION_LIBRARY_PATH.test(trimmed);
}

export function filterAbandonablePaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of paths) {
    if (typeof raw !== 'string') continue;
    const path = raw.trim();
    if (!isAbandonableUploadPath(path) || seen.has(path)) continue;
    seen.add(path);
    out.push(path);
  }
  return out;
}

/** True when a public media URL points at this exact storage object path. */
export function mediaUrlPointsAtPath(url: string | null | undefined, path: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const needle = `/storage/v1/object/public/media/${path}`;
  const idx = url.indexOf(needle);
  if (idx === -1) return false;
  const after = url.slice(idx + needle.length);
  return after === '' || after.startsWith('?') || after.startsWith('#');
}
