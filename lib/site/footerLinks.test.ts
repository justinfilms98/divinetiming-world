import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getFooterLinks, getHeroPlatformLinks } from './footerLinks';
import { Footer } from '@/components/layout/Footer';
import { SocialLinks } from '@/components/layout/SocialLinks';
import { getPlatformLinks } from '@/lib/platformLinks';
import type { SiteSettings } from '@/lib/types/content';

const PRODUCTION_TODAY = {
  instagram_url: 'https://www.instagram.com/divinetimingworld',
  youtube_url: 'https://www.youtube.com/@divinetimingworld',
  spotify_url: 'https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS',
};

describe('getFooterLinks', () => {
  it('before migration 059 shows the same three links as today, now with the Instagram handle', () => {
    expect(getFooterLinks(PRODUCTION_TODAY).map((l) => [l.key, l.handle ?? null])).toEqual([
      ['spotify', null],
      ['youtube', null],
      ['instagram', '@divinetimingworld'],
    ]);
  });

  it('adds the configured links in the owner-approved order', () => {
    const links = getFooterLinks({
      ...PRODUCTION_TODAY,
      instagram_secondary_url: 'https://www.instagram.com/divinetiming_ofc',
      soundcloud_url: 'https://soundcloud.com/divinetiming_music',
      beatport_url: 'https://www.beatport.com/artist/divinetiming/1423755',
    });
    expect(links.map((l) => l.key)).toEqual(['spotify', 'youtube', 'instagram', 'instagram2', 'soundcloud', 'beatport']);
    expect(links.filter((l) => l.icon === 'instagram').map((l) => l.handle)).toEqual(['@divinetimingworld', '@divinetiming_ofc']);
    expect(links.find((l) => l.key === 'instagram2')?.label).toBe('Instagram @divinetiming_ofc');
  });

  it('keeps unconfigured or invalid links hidden', () => {
    const links = getFooterLinks({
      ...PRODUCTION_TODAY,
      instagram_secondary_url: '',
      soundcloud_url: 'http://soundcloud.com/insecure',
      beatport_url: 'https://evil.example/beatport',
    });
    expect(links.map((l) => l.key)).toEqual(['spotify', 'youtube', 'instagram']);
  });

  it('does not repeat the same Instagram account twice', () => {
    const links = getFooterLinks({ ...PRODUCTION_TODAY, instagram_secondary_url: 'https://instagram.com/DivineTimingWorld/' });
    expect(links.filter((l) => l.icon === 'instagram')).toHaveLength(1);
  });

  it('every link opens an https address', () => {
    for (const link of getFooterLinks({ ...PRODUCTION_TODAY, soundcloud_url: 'https://soundcloud.com/x' })) {
      expect(link.href.startsWith('https://')).toBe(true);
    }
  });
});

const PRODUCTION_NOW = {
  ...PRODUCTION_TODAY,
  apple_music_url: 'https://music.apple.com/es/artist/divine-timing/1851580045',
  instagram_secondary_url: 'https://www.instagram.com/divinetiming_ofc',
  soundcloud_url: 'https://soundcloud.com/divinetiming_music',
  beatport_url: 'https://www.beatport.com/artist/divinetiming/1423755',
};

/** Accessible name and visible text of each link inside the social list, in page order. */
function socialLinksIn(html: string) {
  const list = html.slice(html.indexOf('aria-label="Social and music links"'));
  return [...list.matchAll(/<li class="([^"]*)"><a [^>]*aria-label="([^"]+)"[^>]*>.*?<span[^>]*>([^<]+)<\/span><\/a><\/li>/g)].map(
    (m) => ({ name: m[2], text: m[3], fullRow: m[1].includes('col-span-2') })
  );
}

const EXPECTED_SOCIAL = [
  { name: 'Spotify', text: 'Spotify', fullRow: false },
  { name: 'YouTube', text: 'YouTube', fullRow: false },
  { name: 'Instagram @divinetimingworld', text: '@divinetimingworld', fullRow: true },
  { name: 'Instagram @divinetiming_ofc', text: '@divinetiming_ofc', fullRow: true },
  { name: 'SoundCloud', text: 'SoundCloud', fullRow: false },
  { name: 'Beatport', text: 'Beatport', fullRow: false },
];

describe('Social links in the footer and mobile menu', () => {
  it('footer: all six links show an icon and a label, in the approved order', () => {
    const html = renderToStaticMarkup(createElement(Footer, { siteSettings: PRODUCTION_NOW as SiteSettings }));
    expect(socialLinksIn(html)).toEqual(EXPECTED_SOCIAL);
    expect(html.match(/aria-label="Social and music links"/g)).toHaveLength(1);
  });

  it('mobile menu: the same six links, so the menu and footer never disagree', () => {
    const html = renderToStaticMarkup(createElement(SocialLinks, { links: getFooterLinks(PRODUCTION_NOW) }));
    expect(socialLinksIn(html)).toEqual(EXPECTED_SOCIAL);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('labels can never be clipped: each Instagram handle has its own full-width row on narrow screens', () => {
    const html = renderToStaticMarkup(createElement(SocialLinks, { links: getFooterLinks(PRODUCTION_NOW) }));
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('@[38rem]:grid-cols-3');
    expect((html.match(/min-h-\[44px\]/g) ?? []).length).toBe(6);
  });

  it('renders nothing when no links are configured', () => {
    expect(renderToStaticMarkup(createElement(SocialLinks, { links: [] }))).toBe('');
  });
});

describe('getHeroPlatformLinks', () => {
  it('shows SoundCloud where Apple Music was, keeping the row at four icons', () => {
    expect(getHeroPlatformLinks(PRODUCTION_NOW).map((l) => [l.key, l.href])).toEqual([
      ['spotify', 'https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS'],
      ['soundcloud', 'https://soundcloud.com/divinetiming_music'],
      ['youtube', 'https://www.youtube.com/@divinetimingworld'],
      ['instagram', 'https://www.instagram.com/divinetimingworld'],
    ]);
  });

  it('keeps Apple Music when SoundCloud is missing or invalid', () => {
    for (const soundcloud_url of [null, '', 'http://soundcloud.com/x', 'https://evil.example/soundcloud']) {
      const keys = getHeroPlatformLinks({ ...PRODUCTION_NOW, soundcloud_url }).map((l) => l.key);
      expect(keys).toEqual(['spotify', 'appleMusic', 'youtube', 'instagram']);
    }
  });

  it('leaves the Apple Music link itself untouched for other pages', () => {
    getHeroPlatformLinks(PRODUCTION_NOW);
    expect(getPlatformLinks(PRODUCTION_NOW).find((l) => l.id === 'appleMusic')?.href).toBe(
      'https://music.apple.com/es/artist/divine-timing/1851580045'
    );
  });
});

describe('migration 059', () => {
  const dir = join(process.cwd(), 'supabase/migrations');
  const up = readFileSync(join(dir, '059_d2b_creative_controls.sql'), 'utf8').toLowerCase();
  const down = readFileSync(join(dir, '059_d2b_creative_controls.down.sql'), 'utf8').toLowerCase();

  it('only adds nullable columns and checks; never drops, rewrites data or touches policies', () => {
    const statements = up.replace(/--.*$/gm, '');
    expect(statements).not.toMatch(/\bdrop\b|\bupdate\b|\bdelete\b|\binsert\b|\bpolicy\b|\bgrant\b|\brevoke\b|not null|\bdefault\b/);
    expect(statements.match(/add column if not exists/g)).toHaveLength(7);
  });

  it('down script removes exactly what the up script adds', () => {
    for (const col of ['secondary_cta_text', 'secondary_cta_url', 'instagram_secondary_url', 'soundcloud_url', 'beatport_url', 'home_sections', 'section_copy']) {
      expect(up).toContain(`add column if not exists ${col}`);
      expect(down).toContain(`drop column if exists ${col}`);
    }
    for (const c of ['site_settings_d2b_links_https', 'site_settings_home_sections_object', 'page_settings_section_copy_object']) {
      expect(up).toContain(c);
      expect(down).toContain(`drop constraint if exists ${c}`);
    }
  });
});
