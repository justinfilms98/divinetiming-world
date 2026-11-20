import { describe, expect, it } from 'vitest';
import { filterAbandonablePaths, isAbandonableUploadPath, mediaUrlPointsAtPath } from './abandonUploads';

describe('abandonUploads', () => {
  it('accepts timestamped library and poster paths from upload-path', () => {
    expect(isAbandonableUploadPath('library/1795198000000-test.jpg')).toBe(true);
    expect(isAbandonableUploadPath('library/posters/1795198000000-clip-poster.jpg')).toBe(true);
  });

  it('rejects owner-looking or traversal paths', () => {
    expect(isAbandonableUploadPath('library/hero_1.mp4')).toBe(false);
    expect(isAbandonableUploadPath('library/../secret')).toBe(false);
    expect(isAbandonableUploadPath('/library/1795198000000-test.jpg')).toBe(false);
    expect(isAbandonableUploadPath('private/1795198000000-test.jpg')).toBe(false);
  });

  it('dedupes and drops invalid entries', () => {
    expect(
      filterAbandonablePaths([
        'library/1795198000000-a.jpg',
        'library/1795198000000-a.jpg',
        'library/evil',
        12,
        'library/posters/1795198000001-b.jpg',
      ])
    ).toEqual(['library/1795198000000-a.jpg', 'library/posters/1795198000001-b.jpg']);
  });

  it('matches exact public media URLs for a path', () => {
    const path = 'library/posters/1795198000000-clip-poster.jpg';
    const url = `https://goapnjajsjslxbjqthyo.supabase.co/storage/v1/object/public/media/${path}`;
    expect(mediaUrlPointsAtPath(url, path)).toBe(true);
    expect(mediaUrlPointsAtPath(`${url}?v=1`, path)).toBe(true);
    expect(mediaUrlPointsAtPath(`${url}-extra`, path)).toBe(false);
    expect(mediaUrlPointsAtPath(url, 'library/1795198000000-other.jpg')).toBe(false);
  });
});
