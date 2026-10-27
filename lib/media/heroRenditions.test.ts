import { describe, expect, it } from 'vitest';
import { heroRenditionFor, pickHeroVariant } from './heroRenditions';

const ORIGINAL = 'https://lokewuvbrrvmlgdwivoa.supabase.co/storage/v1/object/public/media/library/1779483817012-hero_1.mp4';

describe('heroRenditionFor', () => {
  it('maps a known original to versioned rendition URLs', () => {
    const r = heroRenditionFor(ORIGINAL);
    expect(r?.desktop).toMatch(/\/media\/hero\/optimized\/hero-1-1080p-[0-9a-f]{10}\.mp4$/);
    expect(r?.mobile).toMatch(/\/media\/hero\/optimized\/hero-1-720p-[0-9a-f]{10}\.mp4$/);
    expect(r?.poster).toMatch(/hero-1-poster-1920-[0-9a-f]{10}\.webp$/);
  });

  it('ignores query strings on the original URL', () => {
    expect(heroRenditionFor(`${ORIGINAL}?t=1`)).not.toBeNull();
  });

  it('returns null for media without renditions, so it plays as uploaded', () => {
    expect(heroRenditionFor('https://example.com/library/other.mp4')).toBeNull();
    expect(heroRenditionFor(null)).toBeNull();
    // The unused duplicate upload of hero 1 has no renditions.
    expect(heroRenditionFor(ORIGINAL.replace('1779483817012', '1779483084445'))).toBeNull();
  });
});

describe('pickHeroVariant', () => {
  it('uses the phone rendition below 768px', () => {
    expect(pickHeroVariant({ viewportWidth: 390 })).toBe('mobile');
    expect(pickHeroVariant({ viewportWidth: 767 })).toBe('mobile');
  });

  it('uses the desktop rendition from 768px', () => {
    expect(pickHeroVariant({ viewportWidth: 768 })).toBe('desktop');
    expect(pickHeroVariant({ viewportWidth: 1440, effectiveType: '4g' })).toBe('desktop');
  });

  it('uses the phone rendition on wide screens with a slow measured downlink', () => {
    expect(pickHeroVariant({ viewportWidth: 1440, effectiveType: '4g', downlink: 2.5 })).toBe('mobile');
    expect(pickHeroVariant({ viewportWidth: 1440, effectiveType: '4g', downlink: 10 })).toBe('desktop');
  });

  it('shows still frames only with Data Saver or a 3G-class connection or slower', () => {
    expect(pickHeroVariant({ viewportWidth: 1440, saveData: true })).toBe('posters');
    expect(pickHeroVariant({ viewportWidth: 390, effectiveType: '3g' })).toBe('posters');
    expect(pickHeroVariant({ viewportWidth: 390, effectiveType: '2g' })).toBe('posters');
    expect(pickHeroVariant({ viewportWidth: 390, effectiveType: 'slow-2g' })).toBe('posters');
  });

  it('falls back to screen size when the browser reports no connection info (Safari)', () => {
    expect(pickHeroVariant({ viewportWidth: 390 })).toBe('mobile');
    expect(pickHeroVariant({ viewportWidth: 1440 })).toBe('desktop');
  });
});
