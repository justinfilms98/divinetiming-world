import { describe, expect, it, vi } from 'vitest';
import { isJournalPath, isJournalPublicViaRest, isPublicJournalSlug, journalGateDecision, journalSlugFromPath } from './visibility';

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

  it('if the episode check fails, the page decides (it applies the same switch and rules itself)', async () => {
    expect(await isPublicJournalSlug('episode-3', CONFIG, fakeFetch({}, 503))).toBe(true);
    expect(await isPublicJournalSlug('episode-3', CONFIG, vi.fn(async () => { throw new Error('offline'); }))).toBe(true);
  });
});

/** Answers journal_settings and journal_episodes queries the way the database would. */
function db({ publicEnabled, slugs = [] as string[], settingsStatus = 200 }: { publicEnabled: boolean | null; slugs?: string[]; settingsStatus?: number }) {
  return vi.fn(async (url: string) => {
    if (url.includes('/journal_settings')) {
      return new Response(JSON.stringify(publicEnabled === null ? [] : [{ public_enabled: publicEnabled }]), { status: settingsStatus });
    }
    const slug = decodeURIComponent(url.match(/slug=eq\.([^&]+)/)?.[1] ?? '');
    // The database's own rules: nothing is visible while the switch is off.
    return new Response(JSON.stringify(publicEnabled && slugs.includes(slug) ? [{ slug }] : []), { status: 200 });
  }) as unknown as typeof fetch;
}

const PATHS = ['/journal', '/journal/', '/journal/episode-3-barcelona', '/journal/draft-episode', '/journal/a/b', '/journal/Bad Slug'];

describe('journalGateDecision (proxy)', () => {
  it('switched off: every Journal path is a 404, and no episode is even looked up', async () => {
    const f = db({ publicEnabled: false, slugs: ['episode-3-barcelona'] });
    for (const path of PATHS) expect(await journalGateDecision(path, CONFIG, f), path).toBe('not_found');
    expect((f as unknown as ReturnType<typeof vi.fn>).mock.calls.every(([u]) => String(u).includes('/journal_settings'))).toBe(true);
  });

  it('fails closed: no switch row, a database error or no configuration all mean 404', async () => {
    expect(await journalGateDecision('/journal', CONFIG, db({ publicEnabled: null }))).toBe('not_found');
    expect(await journalGateDecision('/journal', CONFIG, db({ publicEnabled: true, settingsStatus: 500 }))).toBe('not_found');
    expect(await journalGateDecision('/journal', CONFIG, vi.fn(async () => { throw new Error('offline'); }))).toBe('not_found');
    expect(await journalGateDecision('/journal', { url: undefined, anonKey: undefined }, db({ publicEnabled: true }))).toBe('not_found');
    expect(await isJournalPublicViaRest(CONFIG, db({ publicEnabled: true }))).toBe(true);
  });

  it('switched on: the list and public episodes open; hidden, unknown and malformed URLs are 404', async () => {
    const f = db({ publicEnabled: true, slugs: ['episode-3-barcelona'] });
    expect(await journalGateDecision('/journal', CONFIG, f)).toBe('next');
    expect(await journalGateDecision('/journal/episode-3-barcelona', CONFIG, f)).toBe('next');
    for (const path of ['/journal/draft-episode', '/journal/a/b', '/journal/Bad Slug']) {
      expect(await journalGateDecision(path, CONFIG, f), path).toBe('not_found');
    }
  });
});
