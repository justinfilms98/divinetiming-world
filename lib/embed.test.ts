import { describe, expect, it } from 'vitest';
import { normalizeHeroEmbed } from './embed';

const ID = 'aqz-KE-bpKQ';
const yt = { provider: 'youtube', id: ID, embed_url: `https://www.youtube.com/embed/${ID}` };

describe('normalizeHeroEmbed — accepted', () => {
  it.each([
    ID,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}`,
    `http://www.youtube.com/watch?v=${ID}`,
    `youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://youtu.be/${ID}`,
    // YouTube app share links and common extras: only the ID is kept.
    `https://youtu.be/${ID}?si=Xk3uZ9aB_cD12eFg`,
    `https://youtu.be/${ID}?si=abc&t=42`,
    `https://www.youtube.com/watch?v=${ID}&si=abc`,
    `https://www.youtube.com/watch?v=${ID}&t=1m30s&feature=share`,
    `https://www.youtube.com/watch?feature=share&v=${ID}`,
    `https://www.youtube.com/embed/${ID}?si=abc`,
    `https://youtu.be/${ID}#t=10`,
    `  https://youtu.be/${ID}?si=abc  `,
  ])('%s → canonical YouTube ID', (input) => {
    expect(normalizeHeroEmbed(input)).toEqual(yt);
  });

  it.each([
    ['76979871', '76979871'],
    ['https://vimeo.com/76979871', '76979871'],
    ['https://www.vimeo.com/76979871?share=copy', '76979871'],
    ['https://vimeo.com/video/76979871', '76979871'],
    ['https://player.vimeo.com/video/76979871?h=abc', '76979871'],
    ['https://vimeo.com/76979871/abcdef1234', '76979871'],
  ])('%s → Vimeo %s', (input, id) => {
    expect(normalizeHeroEmbed(input)).toEqual({ provider: 'vimeo', id, embed_url: `https://player.vimeo.com/video/${id}` });
  });

  it('never returns anything from the link except the canonical ID', () => {
    const r = normalizeHeroEmbed(`https://youtu.be/${ID}?si=TRACKING&utm_source=x`)!;
    expect(JSON.stringify(r)).not.toMatch(/TRACKING|utm_source|si=/);
  });
});

describe('normalizeHeroEmbed — rejected (security)', () => {
  it.each([
    // Unsafe protocols and markup
    `javascript:alert(1)//youtu.be/${ID}`,
    `javascript://www.youtube.com/watch?v=${ID}`,
    `data:text/html,<script>alert(1)</script>`,
    `vbscript:msgbox`,
    `ftp://youtube.com/watch?v=${ID}`,
    `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>`,
    `https://www.youtube.com/embed/${ID}"><script>`,
    // Unapproved or look-alike hosts, and redirects through other sites
    `https://youtube.com.evil.example/watch?v=${ID}`,
    `https://evil.example/youtube.com/watch?v=${ID}`,
    `https://evil.example/?u=https://youtu.be/${ID}`,
    `https://www.google.com/url?q=https://youtu.be/${ID}`,
    `https://youtube.com@evil.example/watch?v=${ID}`,
    `https://user:pass@www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com:8443/watch?v=${ID}`,
    `//evil.example/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://vimeo.com.evil.example/76979871`,
    `https://evil.example/player.vimeo.com/video/76979871`,
    // Unsupported paths and malformed IDs
    `https://www.youtube.com/watch?v=${ID}&v=dQw4w9WgXcQ`,
    `https://www.youtube.com/watch?v=short`,
    `https://www.youtube.com/watch?v=${ID}xx`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/${ID}`,
    `https://youtu.be/${ID}/extra`,
    `https://youtu.be/`,
    `https://www.youtube.com/watch`,
    `https://vimeo.com/channels/staffpicks`,
    `https://vimeo.com/abc`,
    `https://player.vimeo.com/76979871`,
    `https://you tu.be/${ID}`,
    'https://youtu.be/' + 'a'.repeat(600),
    '',
    '   ',
  ])('rejects %s', (input) => {
    expect(normalizeHeroEmbed(input)).toBeNull();
  });
});
