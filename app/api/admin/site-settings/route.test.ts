import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { POST } = await import('./route');

const BEFORE_059 = {
  id: 'site',
  artist_name: 'DIVINE:TIMING',
  instagram_url: 'https://www.instagram.com/divinetimingworld',
  spotify_url: 'https://open.spotify.com/artist/x',
};
const AFTER_059 = { ...BEFORE_059, instagram_secondary_url: null, soundcloud_url: null, beatport_url: null, home_sections: null };

let db: FakeDb;
const row = () => db.tables.site_settings![0]!;

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/admin/site-settings', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

beforeEach(() => {
  db = createFakeDb({ site_settings: [AFTER_059], hero_sections: [] });
  auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
});

describe('POST /api/admin/site-settings — footer links', () => {
  it('saves valid links and leaves other settings alone', async () => {
    const res = await post({
      instagram_secondary_url: 'https://www.instagram.com/divinetiming_ofc',
      soundcloud_url: 'https://soundcloud.com/divinetiming_music',
      beatport_url: 'https://www.beatport.com/artist/divinetiming/1423755',
    });
    expect(res.status).toBe(200);
    expect(row()).toMatchObject({
      instagram_secondary_url: 'https://www.instagram.com/divinetiming_ofc',
      soundcloud_url: 'https://soundcloud.com/divinetiming_music',
      beatport_url: 'https://www.beatport.com/artist/divinetiming/1423755',
      instagram_url: BEFORE_059.instagram_url,
      spotify_url: BEFORE_059.spotify_url,
    });
  });

  it.each([
    [{ soundcloud_url: 'http://soundcloud.com/x' }, /https/],
    [{ beatport_url: 'https://evil.example/beatport' }, /beatport\.com/],
    [{ instagram_secondary_url: 'javascript:alert(1)' }, /Instagram/],
  ])('rejects %j and saves nothing', async (body, message) => {
    const before = structuredClone(row());
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(message);
    expect(row()).toEqual(before);
  });

  it('an empty field clears the link', async () => {
    row().soundcloud_url = 'https://soundcloud.com/x';
    const res = await post({ soundcloud_url: '' });
    expect(res.status).toBe(200);
    expect(row().soundcloud_url).toBeNull();
  });
});

describe('POST /api/admin/site-settings — homepage sections', () => {
  it('merges one switch into the saved set', async () => {
    row().home_sections = { films: false };
    const res = await post({ home_sections: { now_playing: false } });
    expect(res.status).toBe(200);
    expect(row().home_sections).toEqual({ films: false, now_playing: false });
  });

  it.each([{ hero: false }, { now_playing: 'off' }, [true]])('rejects %j', async (value) => {
    const res = await post({ home_sections: value });
    expect(res.status).toBe(400);
    expect(row().home_sections).toBeNull();
  });
});

describe('POST /api/admin/site-settings — before migration 059', () => {
  beforeEach(() => {
    db = createFakeDb({ site_settings: [BEFORE_059], hero_sections: [] });
    auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
  });

  it('section switches report the missing migration and change nothing', async () => {
    const res = await post({ home_sections: { now_playing: false } });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/migration 059/);
    expect(row()).toEqual(BEFORE_059);
  });

  it('existing settings still save exactly as before', async () => {
    const res = await post({ artist_name: 'DIVINE:TIMING', spotify_url: 'https://open.spotify.com/artist/y' });
    expect(res.status).toBe(200);
    expect(row().spotify_url).toBe('https://open.spotify.com/artist/y');
    expect('home_sections' in row()).toBe(false);
  });
});

describe('POST /api/admin/site-settings — access', () => {
  it('refuses signed-out requests before touching the database', async () => {
    const { NextResponse } = await import('next/server');
    auth.result = { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    const res = await post({ soundcloud_url: 'https://soundcloud.com/x' });
    expect(res.status).toBe(401);
    expect(db.calls).toHaveLength(0);
  });
});
