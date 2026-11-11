import { beforeAll, describe, expect, it } from 'vitest';

const SUPA = 'https://lokewuvbrrvmlgdwivoa.supabase.co';
const IMG = `${SUPA}/storage/v1/object/public/media/library/1773117243870-Photo784_Original.jpg`;
let sanitizeBioHtml: (html: string) => string;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPA;
  ({ sanitizeBioHtml } = await import('./sanitize-bio-html'));
});

const ALLOWED_TAGS = new Set(['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'img']);

/** Every tag and attribute in the output is on the allowlist, and every URL is http(s) or same-site relative. */
function expectOnlyAllowedMarkup(out: string) {
  for (const m of out.matchAll(/<\s*([a-zA-Z][\w:-]*)([^>]*)>/g)) {
    const tag = m[1]!.toLowerCase();
    expect(ALLOWED_TAGS.has(tag), `tag <${tag}> in ${out}`).toBe(true);
    for (const a of m[2]!.matchAll(/([^\s=/]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g)) {
      const name = a[1]!.toLowerCase();
      const value = a[2]!.replace(/^["']|["']$/g, '').trim();
      const allowed = (tag === 'a' && name === 'href') || (tag === 'img' && (name === 'src' || name === 'alt'));
      expect(allowed, `attribute ${tag}.${name} in ${out}`).toBe(true);
      if (name === 'href') expect(/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:/i.test(value), `scheme in ${value}`).toBe(false);
      if (name === 'src') expect(value.startsWith(`${SUPA}/storage/v1/object/public/media/`)).toBe(true);
    }
  }
  expect(out).not.toMatch(/javascript:|vbscript:|data:text|<script|\son\w+\s*=/i);
}

describe('sanitizeBioHtml: legitimate About formatting is preserved', () => {
  it.each([
    ['bold and italic', '<p>Hello <strong>bold</strong> and <em>italic</em> text.</p>', '<p>Hello <strong>bold</strong> and <em>italic</em> text.</p>'],
    ['line break', '<p>Line one<br>line two</p>', '<p>Line one<br />line two</p>'],
    ['paragraphs', '<p>First.</p><p>Second.</p>', '<p>First.</p><p>Second.</p>'],
    ['bullet list from Tiptap', '<ul><li><p>One</p></li><li><p>Two</p></li></ul>', '<ul><li><p>One</p></li><li><p>Two</p></li></ul>'],
    ['numbered list from Tiptap', '<ol><li><p>First</p></li></ol>', '<ol><li><p>First</p></li></ol>'],
    ['link keeps href only', '<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://divinetiming.world/events">our events</a></p>', '<p><a href="https://divinetiming.world/events">our events</a></p>'],
    ['relative link', '<p><a href="/events">events</a></p>', '<p><a href="/events">events</a></p>'],
    ['image from site storage', `<img src="${IMG}" alt="The duo">`, `<img src="${IMG}" alt="The duo" />`],
    ['entities', '<p>Rock &amp; roll — "HANUMANTUM" &lt;3 café 🌀</p>', '<p>Rock &amp; roll — "HANUMANTUM" &lt;3 café 🌀</p>'],
  ])('%s', (_name, input, expected) => {
    expect(sanitizeBioHtml(input)).toBe(expected);
  });

  it('leaves the current production bio byte-identical', () => {
    const bio =
      '<p>DIVINE:TIMING are a unique duo who integrate live percussion and vocals into their performances. Their debut single "HANUMANTUM" is out now and has charted in Beatport\'s Top 100 Hype Afro House, alongside SAFAR\'s remix.</p>';
    expect(sanitizeBioHtml(bio)).toBe(bio);
  });
});

describe('sanitizeBioHtml: allowlist policy', () => {
  it.each([
    ['headings are not allowed; text is kept', '<h2>Our story</h2><p>Body</p>', 'Our story<p>Body</p>'],
    ['mailto loses its href', '<p><a href="mailto:info@divinetiming.world">mail us</a></p>', '<p><a>mail us</a></p>'],
    ['images from other hosts are removed', '<p>x</p><img src="https://evil.example/x.png" alt="x">', '<p>x</p>'],
    ['class, id, style, data and title are removed', '<p class="a" id="b" style="color:red" data-x="1"><a href="https://ok.example" title="t">x</a></p>', '<p><a href="https://ok.example">x</a></p>'],
    ['Google Docs paste keeps text and paragraphs', '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><p dir="ltr" style="line-height:1.38"><span style="font-weight:700">Bold run</span><span> normal run</span></p></b>', '<p>Bold run normal run</p>'],
    ['Word paste keeps text and paragraphs', "<p class=MsoNormal><b><span lang=EN-GB style='font-size:12.0pt'>Word bold</span></b><o:p></o:p></p>", '<p>Word bold</p>'],
    ['unclosed tags are closed', '<p>unclosed <strong>bold <em>both', '<p>unclosed <strong>bold <em>both</em></strong></p>'],
    ['implicit list items are closed', '<ul><li>a<li>b</ul>', '<ul><li>a</li><li>b</li></ul>'],
    // Same as an allowed https link to another site; sanitize-html's default (allowProtocolRelative).
    ['protocol-relative links are kept', '<a href="//other.example/x">x</a>', '<a href="//other.example/x">x</a>'],
  ])('%s', (_name, input, expected) => {
    expect(sanitizeBioHtml(input)).toBe(expected);
  });
});

describe('sanitizeBioHtml: injection attempts produce only allowlisted markup', () => {
  it.each([
    ['script tag', '<script>alert(1)</script><p>x</p>'],
    ['img onerror', '<img src=x onerror=alert(1)>'],
    ['event handlers', '<p onclick="alert(1)" onmouseover="alert(2)">x</p>'],
    ['javascript: link', '<a href="javascript:alert(1)">x</a>'],
    ['mixed-case scheme', '<a href="JaVaScRiPt:alert(1)">x</a>'],
    ['tab inside scheme', '<a href="java&#x09;script:alert(1)">x</a>'],
    ['entity-encoded scheme', '<a href=" &#106;avascript:alert(1)">x</a>'],
    ['data: and vbscript:', '<a href="data:text/html;base64,PHNjcmlwdD4=">d</a><a href="vbscript:msgbox(1)">v</a>'],
    ['protocol-relative host', '<a href="//evil.example/x">x</a>'],
    ['duplicate href', '<a href=https://a.example href=javascript:alert(1)>x</a>'],
    ['action/formaction/data/poster/background', '<form action="javascript:alert(1)"><button formaction="javascript:alert(1)">b</button></form><object data="javascript:alert(1)"></object><video poster="javascript:alert(1)"></video>'],
    ['SVG SMIL', '<svg><a><animate attributeName="href" values="javascript:alert(1)"/><text>x</text></a></svg>'],
    ['textarea solidus close', '<textarea></textarea/><img src=x onerror=alert(1)>'],
    ['nonTextTags implied close', '<script><p></script><img src=x onerror=alert(1)><p>y</p>'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'],
    ['noscript mutation', '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>'],
    ['math/mglyph mutation', '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'],
    ['template/style in select', '<select><template><style><img src=x onerror=alert(1)></style></template></select>'],
    ['iframe, embed, style, link', '<iframe src="https://evil.example"></iframe><embed src="x"><style>*{}</style><link rel=stylesheet href=x>'],
    ['comment and CDATA tricks', '<!--><img src=x onerror=alert(1)>--><![CDATA[<img src=x onerror=alert(1)>]]>'],
    ['javascript: image src', `<img src="javascript:alert(1)//${IMG}">`],
  ])('%s', (_name, input) => {
    expectOnlyAllowedMarkup(sanitizeBioHtml(input));
  });
});

describe('sanitizeBioHtml: deeply nested and large input', () => {
  it.each([
    ['5,000 nested inline tags', '<p>' + '<strong><em>'.repeat(5000) + 'deep' + '</em></strong>'.repeat(5000) + '</p>'],
    ['20,000 nested disallowed divs', '<div>'.repeat(20000) + 'x' + '</div>'.repeat(20000)],
    ['2,000 nested lists', '<ul><li>'.repeat(2000) + 'leaf' + '</li></ul>'.repeat(2000)],
    ['1 MB of text', '<p>' + 'word '.repeat(200000) + '</p>'],
  ])('%s finishes quickly and stays allowlisted', (_name, input) => {
    const t0 = performance.now();
    const out = sanitizeBioHtml(input);
    expect(performance.now() - t0).toBeLessThan(2000);
    expectOnlyAllowedMarkup(out);
  });
});
