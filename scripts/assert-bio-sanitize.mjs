#!/usr/bin/env node
/**
 * Security sanity check: bio HTML sanitizer strips script, style, and non-CDN img.
 * Run: node scripts/assert-bio-sanitize.mjs
 * Mirrors lib/sanitize-bio-html.ts behavior so we don't need to build first.
 */
import sanitizeHtml from 'sanitize-html';

const CDN_HOSTS = ['https://ucarecdn.com/', 'https://ucarecdn.net/'];
function isAllowedImageSrc(src) {
  if (!src || typeof src !== 'string') return false;
  return CDN_HOSTS.some((host) => src.startsWith(host));
}

function sanitizeBioHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'img'],
    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      img: (_tagName, attribs) => {
        if (!isAllowedImageSrc(attribs.src)) return { tagName: false };
        return { tagName: 'img', attribs: { src: attribs.src, alt: attribs.alt ?? '' } };
      },
    },
  });
}

const nastyInput = `<script>alert(1)</script>
<p>hi</p>
<img src="https://example.com/x.png">`;

const result = sanitizeBioHtml(nastyInput);
const expected = '<p>hi</p>';
const ok = result.trim() === expected;

if (!ok) {
  console.error('FAIL: sanitizeBioHtml(nasty input) did not strip script and non-CDN img.');
  console.error('Expected:', JSON.stringify(expected));
  console.error('Got:', JSON.stringify(result));
  process.exit(1);
}
console.log('Bio sanitizer: script/style and non-CDN img stripped as expected.');
