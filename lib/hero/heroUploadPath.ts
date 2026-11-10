/**
 * Storage path for a legacy hero media/logo upload. Always unique (timestamped), so a replaced
 * image gets a new URL: browsers, the CDN and the image optimizer (cached 31 days) can never keep
 * serving the old picture at the same address.
 */
export function heroUploadPath(slug: string, type: 'media' | 'logo', ext: string, now: number = Date.now()): string {
  return type === 'logo' ? `hero/logos/${slug}-logo-${now}.${ext}` : `hero/${slug}-${now}.${ext}`;
}
