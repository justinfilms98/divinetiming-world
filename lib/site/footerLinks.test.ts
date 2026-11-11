import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { footerLinkRows, getFooterLinks } from './footerLinks';
import { Footer } from '@/components/layout/Footer';
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

describe('footerLinkRows', () => {
  const PRODUCTION_NOW = {
    ...PRODUCTION_TODAY,
    instagram_secondary_url: 'https://www.instagram.com/divinetiming_ofc',
    soundcloud_url: 'https://soundcloud.com/divinetiming_music',
    beatport_url: 'https://www.beatport.com/artist/divinetiming/1423755',
  };

  it('puts the six live links in two rows of three, keeping their order', () => {
    const rows = footerLinkRows(getFooterLinks(PRODUCTION_NOW)).map((row) => row.map((l) => l.key));
    expect(rows).toEqual([
      ['spotify', 'youtube', 'instagram'],
      ['instagram2', 'soundcloud', 'beatport'],
    ]);
  });

  it('never leaves a link alone on a second row', () => {
    for (let n = 1; n <= 8; n++) {
      const rows = footerLinkRows(Array.from({ length: n }, (_, i) => i));
      expect(rows.flat()).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(rows.length).toBeLessThanOrEqual(2);
      if (rows.length === 2) expect(rows[1].length).toBeGreaterThanOrEqual(2);
    }
    expect(footerLinkRows([])).toEqual([]);
  });

  it('renders every link once, in order, inside the labelled group', () => {
    const html = renderToStaticMarkup(createElement(Footer, { siteSettings: PRODUCTION_NOW as SiteSettings }));
    const group = html.slice(html.indexOf('aria-label="Social and music links"'));
    const labels = [...group.matchAll(/<a [^>]*aria-label="([^"]+)"/g)].map((m) => m[1]).slice(0, 6);
    expect(labels).toEqual([
      'Spotify',
      'YouTube',
      'Instagram @divinetimingworld',
      'Instagram @divinetiming_ofc',
      'SoundCloud',
      'Beatport',
    ]);
    expect(group.match(/<ul /g)?.length).toBeGreaterThanOrEqual(2);
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
