import { describe, expect, it } from 'vitest';
import { checkHomeSectionsInput, HOME_SECTIONS, resolveHomeSections } from './homeSections';

describe('resolveHomeSections', () => {
  it('shows every original section when nothing is configured, and keeps the Journal hidden', () => {
    for (const raw of [null, undefined, {}, 'junk', [false]]) {
      const v = resolveHomeSections(raw);
      expect(Object.entries(v).filter(([, on]) => !on).map(([id]) => id)).toEqual(['journal']);
    }
  });

  it('production today ({ now_playing: false }) is unchanged: only Now playing and the Journal are hidden', () => {
    const v = resolveHomeSections({ now_playing: false });
    expect(Object.entries(v).filter(([, on]) => !on).map(([id]) => id)).toEqual(['now_playing', 'journal']);
  });

  it('the Journal section appears only once an admin switches it on', () => {
    expect(resolveHomeSections({ journal: true }).journal).toBe(true);
    expect(resolveHomeSections({ journal: 'yes' }).journal).toBe(false);
  });

  it('hides only sections explicitly switched off', () => {
    const v = resolveHomeSections({ now_playing: false, films: true, shop: 'no', unknown: false });
    expect(v.now_playing).toBe(false);
    expect(v.films).toBe(true);
    expect(v.shop).toBe(true);
    expect(Object.keys(v)).toEqual(HOME_SECTIONS.map((s) => s.id));
  });

  it('covers the homepage sections in page order', () => {
    expect(HOME_SECTIONS.map((s) => s.id)).toEqual([
      'now_playing',
      'experience',
      'upcoming_events',
      'manifesto',
      'films',
      'journal',
      'tribe',
      'shop',
      'booking',
    ]);
  });
});

describe('checkHomeSectionsInput', () => {
  it('accepts known ids with booleans', () => {
    expect(checkHomeSectionsInput({ now_playing: false, booking: true })).toEqual({ ok: true, value: { now_playing: false, booking: true } });
  });

  it.each([
    [null, 'on/off'],
    [[], 'on/off'],
    [{ hero: false }, 'Unknown homepage section'],
    [{ now_playing: 'false' }, 'must be on or off'],
  ])('rejects %j', (input, message) => {
    const result = checkHomeSectionsInput(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});
