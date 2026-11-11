import { describe, expect, it, vi } from 'vitest';
import { isJournalPath, isPublicJournalSlug, journalSlugFromPath } from './visibility';

const CONFIG = { url: 'https://example.supabase.co', anonKey: 'public-anon-key' };

function fakeFetch(rows: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(rows), { status }));
}

describe('journalSlugFromPath', () => {
  it('reads one segment under /journal', () => {
    expect(journalSlugFromPath('/journal/episode-3-barcelona')).toBe('episode-3-barcelona');
    expect(journalSlugFromPath('/journal/episode-3-barcelona/')).toBe('episode-3-barcelona');
    expect(journalSlugFromPath('/journal')).toBeNull();
    expect(journalSlugFromPath('/journal/a/b')).toBeNull();
    expect(journalSlugFromPath('/journalism')).toBeNull();
  });

  it('only /journal and its children are Journal paths', () => {
    expect(isJournalPath('/journal')).toBe(true);
    expect(isJournalPath('/journal/x')).toBe(true);
    expect(isJournalPath('/journalism')).toBe(false);
    expect(isJournalPath('/journey')).toBe(false);
  });
});

describe('isPublicJournalSlug', () => {
  it('asks the database, with the public key, for a published or coming-soon episode', async () => {
    const f = fakeFetch([{ slug: 'episode-3-barcelona' }]);
    expect(await isPublicJournalSlug('episode-3-barcelona', CONFIG, f)).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      'https://example.supabase.co/rest/v1/journal_episodes?select=slug&slug=eq.episode-3-barcelona&status=in.(published,coming_soon)&limit=1'
    );
    expect((init.headers as Record<string, string>).apikey).toBe('public-anon-key');
  });

  it('a draft, archived or unknown episode (no row) is not public', async () => {
    expect(await isPublicJournalSlug('draft-episode', CONFIG, fakeFetch([]))).toBe(false);
  });

  it('malformed slugs are refused without asking the database', async () => {
    const f = fakeFetch([{ slug: 'x' }]);
    for (const bad of ['Bad Slug', '../etc', 'a'.repeat(81), "x' or 1=1", '']) {
      expect(await isPublicJournalSlug(bad, CONFIG, f)).toBe(false);
    }
    expect(f).not.toHaveBeenCalled();
  });

  it('if the database is unreachable the page decides, so a real episode is never hidden', async () => {
    expect(await isPublicJournalSlug('episode-3', CONFIG, fakeFetch({}, 503))).toBe(true);
    expect(await isPublicJournalSlug('episode-3', CONFIG, vi.fn(async () => { throw new Error('offline'); }))).toBe(true);
  });
});
