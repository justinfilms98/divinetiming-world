import { describe, expect, it } from 'vitest';
import { isNavItemActive, NAV_LEFT_COUNT, publicNavItems } from './navigation';

describe('public navigation', () => {
  it('is unchanged while the Journal is switched off', () => {
    expect(publicNavItems(false).map((i) => i.label)).toEqual(['MUSIC', 'EVENTS', 'JOURNEY', 'MEDIA', 'SHOP', 'BOOK']);
  });

  it('adds JOURNAL to the right-hand group when the Journal is on', () => {
    const items = publicNavItems(true);
    expect(items.slice(0, NAV_LEFT_COUNT).map((i) => i.label)).toEqual(['MUSIC', 'EVENTS', 'JOURNEY']);
    expect(items.slice(NAV_LEFT_COUNT).map((i) => i.label)).toEqual(['JOURNAL', 'MEDIA', 'SHOP', 'BOOK']);
  });

  it('keeps JOURNAL highlighted on episode pages, and nothing else', () => {
    const items = publicNavItems(true);
    const active = (path: string) => items.filter((i) => isNavItemActive(i, path)).map((i) => i.label);
    expect(active('/journal')).toEqual(['JOURNAL']);
    expect(active('/journal/episode-3-barcelona')).toEqual(['JOURNAL']);
    expect(active('/journalism')).toEqual([]);
    expect(active('/journey')).toEqual(['JOURNEY']);
    // Other items keep exact matching, as before.
    expect(active('/music/some-release')).toEqual([]);
    expect(active('/events')).toEqual(['EVENTS']);
  });
});
