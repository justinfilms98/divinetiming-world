/**
 * Sanitize About bio HTML before saving to DB.
 * Server-only. Used in API route.
 *
 * Allowlist: p, strong, em, a, ul, ol, li, br, img.
 * Links: href only. Images: src + alt only; src restricted to Supabase storage (media bucket) or legacy ucarecdn.
 * No inline styles, no div/section/script/style.
 *
 * Security: script and style tags are not in allowedTags so they are stripped.
 * img tags with non-allowed src are removed via transformTags (tagName: false).
 */

import sanitizeHtml from 'sanitize-html';

const LEGACY_CDN_HOSTS = ['https://ucarecdn.com/', 'https://ucarecdn.net/'];

function isAllowedImageSrc(src: string | undefined): boolean {
  if (!src || typeof src !== 'string') return false;
  if (LEGACY_CDN_HOSTS.some((host) => src.startsWith(host))) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (base && src.startsWith(base.replace(/\/$/, '') + '/storage/v1/object/public/media/')) return true;
  return false;
}

export function sanitizeBioHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'img'],
    allowedAttributes: {
      a: ['href'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      img: (_tagName: string, attribs: Record<string, string>) => {
        if (!isAllowedImageSrc(attribs.src)) {
          return { tagName: false as const, attribs: {} as Record<string, string> };
        }
        return {
          tagName: 'img',
          attribs: {
            src: attribs.src!,
            alt: attribs.alt ?? '',
          },
        };
      },
    },
  });
}
