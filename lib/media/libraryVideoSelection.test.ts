import { describe, expect, it } from 'vitest';
import { humanizeFileName, selectLibraryVideos, type LibraryVideoRow } from './libraryVideoSelection';

const base = 'https://x.supabase.co/storage/v1/object/public/media/library/';
const row = (id: string, name: string, file: string, extra: Partial<LibraryVideoRow> = {}): LibraryVideoRow => ({
  id,
  name,
  preview_url: `${base}${file}`,
  thumbnail_url: null,
  mime_type: 'video/mp4',
  ...extra,
});

// Mirrors production on 2026-10-26: three hero clips uploaded repeatedly, one editorial clip.
const rows: LibraryVideoRow[] = [
  row('a', 'hero 1.mp4', '1779483817012-hero_1.mp4'),
  row('b', 'hero 1.mp4', '1779483084445-hero_1.mp4'),
  row('c', 'hero 2.mp4', '1779482521222-hero_2.mp4'),
  row('d', 'hero 1.mp4', '1779482536732-hero_1.mp4'),
  row('e', 'hero 3.mp4', '1779482501628-hero_3.mp4'),
  row('f', 'hero 3.mp4', '1779482476054-hero_3.mp4'),
  row('g', 'hero 2.mp4', '1779482471929-hero_2.mp4'),
  row('h', 'website 1.mp4', '1779481436565-website_1.mp4'),
];

const heroes = [
  {
    hero_slots: [
      { video_url: `${base}1779483817012-hero_1.mp4` },
      { video_url: `${base}1779482521222-hero_2.mp4` },
      { video_url: `${base}1779482501628-hero_3.mp4` },
    ],
  },
];

describe('selectLibraryVideos', () => {
  it('drops hero placements and re-uploads of the same hero files', () => {
    const out = selectLibraryVideos(rows, heroes);
    expect(out.map((v) => v.id)).toEqual(['lib-h']);
    expect(out[0].title).toBe('Website 1');
  });

  it('collapses same-name duplicates that are not hero footage', () => {
    const out = selectLibraryVideos([row('x', 'Live set.mp4', '1-live.mp4'), row('y', 'Live set.mp4', '2-live.mp4')], []);
    expect(out.map((v) => v.id)).toEqual(['lib-x']);
  });

  it('never uses the video file as an image thumbnail; prefers editorial alt text as title', () => {
    const out = selectLibraryVideos(
      [row('z', 'clip_final.mp4', 'clip.mp4', { thumbnail_url: `${base}clip.mp4`, alt_text: 'Tenerife sunset set' })],
      []
    );
    expect(out[0].thumbnail_url).toBeNull();
    expect(out[0].title).toBe('Tenerife sunset set');
  });
});

describe('humanizeFileName', () => {
  it('strips extensions, timestamps and separators', () => {
    expect(humanizeFileName('1779481436565-website_1.mp4')).toBe('Website 1');
    expect(humanizeFileName('hero 1.mp4')).toBe('Hero 1');
  });
});
