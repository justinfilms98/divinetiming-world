/**
 * Validation for owner-entered links to other sites (footer socials) and for hero button
 * destinations. Shared by the admin APIs and the public renderers, so a value the API refused
 * can never be shown, and a malformed value that reached the database some other way is hidden.
 */

export type LinkCheck = { ok: true; value: string | null } | { ok: false; error: string };

const MAX_URL_LENGTH = 300;

export const SOCIAL_HOSTS = {
  instagram: ['instagram.com'],
  soundcloud: ['soundcloud.com'],
  beatport: ['beatport.com'],
} as const;

function hostMatches(hostname: string, allowed: readonly string[]): boolean {
  const host = hostname.toLowerCase();
  return allowed.some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * An https link on one of `allowedHosts`. Empty input clears the field (null).
 * @param name Field name used in the error message, e.g. "SoundCloud".
 */
export function checkSocialUrl(raw: unknown, allowedHosts: readonly string[], name: string): LinkCheck {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== 'string') return { ok: false, error: `${name} link must be text.` };
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > MAX_URL_LENGTH) return { ok: false, error: `${name} link is too long.` };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: `${name} link must be a full address starting with https://` };
  }
  if (url.protocol !== 'https:') return { ok: false, error: `${name} link must start with https://` };
  if (url.username || url.password) return { ok: false, error: `${name} link can't contain a login.` };
  if (!hostMatches(url.hostname, allowedHosts)) {
    return { ok: false, error: `${name} link must be on ${allowedHosts.join(' or ')}.` };
  }
  return { ok: true, value: url.toString() };
}

/** "@handle" from an Instagram profile URL, or null when the URL has no profile path. */
export function instagramHandle(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!hostMatches(parsed.hostname, SOCIAL_HOSTS.instagram)) return null;
    const first = parsed.pathname.split('/').filter(Boolean)[0];
    return first && /^[A-Za-z0-9._]{1,30}$/.test(first) ? `@${first.toLowerCase()}` : null;
  } catch {
    return null;
  }
}

const MAX_CTA_LABEL = 40;

/**
 * A hero button destination: a site path ("/music", "/#tribe"), a same-page anchor ("#tribe")
 * or an https link. Protocol-relative ("//host") and every other scheme are refused.
 */
export function checkCtaUrl(raw: unknown): LinkCheck {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== 'string') return { ok: false, error: 'Button link must be text.' };
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > MAX_URL_LENGTH) return { ok: false, error: 'Button link is too long.' };
  if (/\s/.test(value)) return { ok: false, error: "Button link can't contain spaces." };
  if (value.startsWith('#')) {
    return /^#[A-Za-z][\w-]*$/.test(value) ? { ok: true, value } : { ok: false, error: 'Anchor links look like #tribe.' };
  }
  if (value.startsWith('/')) {
    if (value.startsWith('//') || value.includes('\\')) return { ok: false, error: 'Button link must be a page on this site, like /music.' };
    return { ok: true, value };
  }
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return { ok: true, value: url.toString() };
  } catch {
    // fall through
  }
  return { ok: false, error: 'Button link must be a page on this site (/music, /#tribe) or start with https://' };
}

export function checkCtaLabel(raw: unknown): LinkCheck {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== 'string') return { ok: false, error: 'Button label must be text.' };
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > MAX_CTA_LABEL) return { ok: false, error: `Button label must be ${MAX_CTA_LABEL} characters or fewer.` };
  return { ok: true, value };
}
