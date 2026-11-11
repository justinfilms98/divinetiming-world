import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getFooterLinks } from './footerLinks';

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
