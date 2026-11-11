import { describe, expect, it } from 'vitest';
import {
  checkJournalInput,
  episodeLabel,
  isPublicJournalStatus,
  isSlugLocked,
  playerUrlFor,
  publicReadinessProblems,
  suggestJournalSlug,
  toJournalSlug,
  upcomingDateLabel,
  watchUrlFor,
} from './rules';
import { videoObjectJsonLd } from '@/lib/seo/jsonld';
import { createFakeDb, fakeSupabase } from '@/test/fakeSupabase';

describe('slugs', () => {
  it('suggests "episode-3-barcelona" from the number and title', () => {
    expect(suggestJournalSlug(3, 'Barcelona')).toBe('episode-3-barcelona');
    expect(suggestJournalSlug(null, 'Iceland: fire & ice')).toBe('iceland-fire-ice');
  });

  it('matches the database rule (lowercase words, single hyphens, max 80)', () => {
    expect(toJournalSlug('  Café  Déjà--Vu! ')).toBe('cafe-deja-vu');
    const long = toJournalSlug('a'.repeat(79) + ' b c');
    expect(long.length).toBeLessThanOrEqual(80);
    expect(long).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(toJournalSlug('!!!')).toBe('');
  });

  it('locks the URL once an episode has been published', () => {
    expect(isSlugLocked({ published_at: null })).toBe(false);
    expect(isSlugLocked({ published_at: '2026-11-11T00:00:00Z' })).toBe(true);
  });
});

describe('checkJournalInput', () => {
  it('requires a title on create and keeps only the fields sent on update', () => {
    expect(checkJournalInput({}, 'create')).toEqual({ ok: false, error: 'Title is required.' });
    const r = checkJournalInput({ summary: '  Short  ' }, 'update');
    expect(r).toEqual({ ok: true, episode: { summary: 'Short' }, video: null });
  });

  it.each([
    [{ title: 'x'.repeat(121) }, /at most 120/],
    [{ title: 'ok', summary: 'x'.repeat(301) }, /Summary can be at most 300/],
    [{ title: 'ok', release_note: 'x'.repeat(61) }, /at most 60/],
    [{ title: 'ok', episode_number: 0 }, /1 to 9999/],
    [{ title: 'ok', episode_number: 2.5 }, /1 to 9999/],
    [{ title: 'ok', cover_image_url: 'http://example.com/a.jpg' }, /https/],
    [{ title: 'ok', cover_image_url: 'javascript:alert(1)' }, /https|not valid/],
    [{ title: 'ok', gallery_id: 'not-a-uuid' }, /Collection/],
    [{ title: 'ok', scheduled_for: 'soon' }, /not a valid date/],
    [{ title: 'ok', status: 'live' }, /Status must be/],
    [{ title: 'ok', slug: '!!!' }, /Episode URL/],
  ])('rejects %j', (body, message) => {
    const r = checkJournalInput(body, 'create');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(message);
  });

  it('empty text clears a field; empty episode number clears it', () => {
    const r = checkJournalInput({ location: '  ', episode_number: '', cover_image_url: '' }, 'update');
    expect(r).toMatchObject({ ok: true, episode: { location: null, episode_number: null, cover_image_url: null } });
  });

  it('accepts video links only through the strict YouTube/Vimeo parser', () => {
    for (const link of ['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'https://youtu.be/aqz-KE-bpKQ', 'aqz-KE-bpKQ', 'https://youtu.be/aqz-KE-bpKQ?si=Xk3uZ9aB']) {
      const r = checkJournalInput({ video_url: link }, 'update');
      expect(r).toMatchObject({ ok: true, video: { provider: 'youtube', video_id: 'aqz-KE-bpKQ' } });
    }
    expect(checkJournalInput({ video_url: 'https://vimeo.com/76979871' }, 'update')).toMatchObject({
      ok: true,
      video: { provider: 'vimeo', video_id: '76979871' },
    });
    for (const bad of ['https://evil.example/watch?v=aqz-KE-bpKQ', '<iframe src="x">', 'https://youtu.be/short', 'javascript:alert(1)//youtu.be/aqz-KE-bpKQ']) {
      const r = checkJournalInput({ video_url: bad }, 'update');
      expect(r.ok, bad).toBe(false);
    }
  });

  it('an empty video link removes the video', () => {
    expect(checkJournalInput({ video_url: '' }, 'update')).toMatchObject({ ok: true, video: { remove: true } });
  });
});

describe('publication rules', () => {
  it('only published and coming-soon episodes are public', () => {
    expect(['draft', 'coming_soon', 'published', 'archived'].filter(isPublicJournalStatus)).toEqual(['coming_soon', 'published']);
  });

  it('an episode needs a title, cover and summary before anyone can see it', () => {
    expect(publicReadinessProblems({ title: 'Barcelona', cover_image_url: null, summary: '' })).toEqual(['a cover image', 'a summary']);
    expect(publicReadinessProblems({ title: 'Barcelona', cover_image_url: 'https://x/y.jpg', summary: 'Two days.' })).toEqual([]);
  });

  it('shows a planned date only while it is still ahead, and never invents one', () => {
    const now = new Date('2026-11-11T12:00:00Z');
    expect(upcomingDateLabel(null, now)).toBeNull();
    expect(upcomingDateLabel('2026-11-01T00:00:00Z', now)).toBeNull();
    expect(upcomingDateLabel('2026-12-05T00:00:00Z', now)).toBe('5 December 2026');
  });

  it('labels episodes "EP 03 · Barcelona"', () => {
    expect(episodeLabel({ episode_number: 3, location: 'Barcelona' })).toBe('EP 03 · Barcelona');
    expect(episodeLabel({ episode_number: null, location: null })).toBe('');
  });
});

describe('video delivery', () => {
  it('uses privacy-friendly players that only start after a click, plus a watch link', () => {
    expect(playerUrlFor('youtube', 'aqz-KE-bpKQ')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/aqz-KE-bpKQ\?autoplay=1/);
    expect(playerUrlFor('vimeo', '76979871')).toMatch(/^https:\/\/player\.vimeo\.com\/video\/76979871\?autoplay=1&dnt=1/);
    expect(watchUrlFor('youtube', 'aqz-KE-bpKQ')).toBe('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  });

  it('structured data only for published episodes with a video, thumbnail and date', () => {
    const base = {
      status: 'published',
      name: 'Episode 3 — Barcelona',
      description: 'Two days in Barcelona.',
      thumbnailUrl: 'https://x/cover.jpg',
      uploadDate: '2026-11-11T00:00:00Z',
      embedUrl: 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
      durationSeconds: 754,
    };
    expect(videoObjectJsonLd(base)).toMatchObject({ '@type': 'VideoObject', duration: 'PT12M34S' });
    for (const status of ['draft', 'coming_soon', 'archived']) expect(videoObjectJsonLd({ ...base, status })).toBeNull();
    expect(videoObjectJsonLd({ ...base, embedUrl: null })).toBeNull();
    expect(videoObjectJsonLd({ ...base, thumbnailUrl: null })).toBeNull();
    expect(videoObjectJsonLd({ ...base, uploadDate: null })).toBeNull();
  });
});

describe('test database stand-in', () => {
  it('filters by several statuses with .in()', async () => {
    const db = createFakeDb({
      journal_episodes: [
        { id: '1', status: 'draft' },
        { id: '2', status: 'coming_soon' },
        { id: '3', status: 'published' },
        { id: '4', status: 'archived' },
      ],
    });
    const { data } = await fakeSupabase(db).from('journal_episodes').select().in('status', ['published', 'coming_soon']);
    expect((data as { id: string }[]).map((r) => r.id)).toEqual(['2', '3']);
  });
});
