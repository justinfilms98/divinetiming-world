import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { GET, POST, PATCH, DELETE } = await import('./route');

const COVER = 'https://example.supabase.co/storage/v1/object/public/media/library/cover.jpg';
const PUBLISHED = {
  id: 'ep-pub',
  slug: 'episode-1-tenerife',
  episode_number: 1,
  title: 'Tenerife',
  summary: 'Where it started.',
  cover_image_url: COVER,
  status: 'published',
  published_at: '2026-10-01T00:00:00Z',
  display_order: 0,
};

let db: FakeDb;
const episodes = () => db.tables.journal_episodes!;
const videos = () => db.tables.journal_episode_videos!;

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/admin/journal', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }));
}

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear();
  db = createFakeDb({ journal_episodes: [PUBLISHED], journal_episode_videos: [] });
  auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
});

describe('creating episodes', () => {
  it('starts as a draft with a suggested URL, at the top of the order', async () => {
    const res = await post({ title: 'Barcelona', episode_number: 3 });
    expect(res.status).toBe(200);
    const { episode } = (await res.json()).data;
    expect(episode).toMatchObject({ status: 'draft', slug: 'episode-3-barcelona', display_order: -1 });
    expect(episode.published_at ?? null).toBeNull();
  });

  it('refuses to make an incomplete episode public, and saves nothing', async () => {
    for (const status of ['published', 'coming_soon']) {
      const res = await post({ title: 'Iceland', episode_number: 4, status });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/needs a cover image and a summary/);
    }
    expect(episodes()).toHaveLength(1);
  });

  it('publishing a complete episode records when it was published', async () => {
    const res = await post({ title: 'Iceland', summary: 'Fire and ice.', cover_image_url: COVER, status: 'published' });
    const { episode } = (await res.json()).data;
    expect(episode.status).toBe('published');
    expect(Date.parse(episode.published_at)).not.toBeNaN();
  });

  it('rejects a URL another episode uses', async () => {
    const res = await post({ title: 'Copy', slug: 'episode-1-tenerife' });
    expect(res.status).toBe(409);
  });

  it('rejects a video link that is not a strict YouTube or Vimeo link, and saves nothing', async () => {
    const res = await post({ title: 'Barcelona', video_url: 'https://evil.example/video' });
    expect(res.status).toBe(400);
    expect(episodes()).toHaveLength(1);
    expect(videos()).toHaveLength(0);
  });
});

describe('editing episodes', () => {
  it('a partial edit changes only what was sent and keeps the status', async () => {
    const res = await post({ id: PUBLISHED.id, location: 'Tenerife, Spain' });
    expect(res.status).toBe(200);
    expect(episodes()[0]).toMatchObject({ ...PUBLISHED, location: 'Tenerife, Spain' });
  });

  it('a published episode keeps its URL', async () => {
    const res = await post({ id: PUBLISHED.id, slug: 'something-else' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/URL can’t change/);
    expect(episodes()[0]!.slug).toBe(PUBLISHED.slug);
  });

  it('clearing the summary of a public episode is refused', async () => {
    const res = await post({ id: PUBLISHED.id, summary: '' });
    expect(res.status).toBe(400);
    expect(episodes()[0]!.summary).toBe(PUBLISHED.summary);
  });

  it('unpublishing keeps the first publish date', async () => {
    await post({ id: PUBLISHED.id, status: 'draft' });
    expect(episodes()[0]).toMatchObject({ status: 'draft', published_at: PUBLISHED.published_at });
  });

  it('saves, replaces and removes the video link in its own table', async () => {
    await post({ id: PUBLISHED.id, video_url: 'https://youtu.be/aqz-KE-bpKQ' });
    expect(videos()).toEqual([expect.objectContaining({ episode_id: PUBLISHED.id, provider: 'youtube', video_id: 'aqz-KE-bpKQ', is_vertical: false })]);
    await post({ id: PUBLISHED.id, video_url: 'https://vimeo.com/76979871', video_is_vertical: true });
    expect(videos()).toEqual([expect.objectContaining({ provider: 'vimeo', video_id: '76979871', is_vertical: true })]);
    await post({ id: PUBLISHED.id, video_url: '' });
    expect(videos()).toHaveLength(0);
    expect(episodes()[0]!.status).toBe('published');
  });

  it('refreshes the Journal, the episode page, the homepage and the sitemap from the server', async () => {
    await post({ id: PUBLISHED.id, location: 'x' });
    expect(vi.mocked(revalidatePath).mock.calls.map((c) => c[0]).sort()).toEqual(['/', '/journal', '/journal/episode-1-tenerife', '/sitemap.xml']);
  });

  it('a missing episode is reported, not created', async () => {
    const res = await post({ id: 'gone', title: 'x' });
    expect(res.status).toBe(404);
    expect(episodes()).toHaveLength(1);
  });
});

describe('listing, reordering and deleting', () => {
  it('lists every episode with its video for the admin', async () => {
    db.tables.journal_episode_videos!.push({ episode_id: PUBLISHED.id, provider: 'youtube', video_id: 'aqz-KE-bpKQ', is_vertical: false, duration_seconds: null });
    const list = (await (await GET()).json()).data;
    expect(list).toEqual([expect.objectContaining({ id: PUBLISHED.id, video: expect.objectContaining({ video_id: 'aqz-KE-bpKQ' }) })]);
  });

  it('swaps two episodes’ positions', async () => {
    episodes().push({ id: 'ep-2', slug: 'b', title: 'B', status: 'draft', display_order: 5 });
    const res = await PATCH(new NextRequest('http://localhost/api/admin/journal', { method: 'PATCH', body: JSON.stringify({ swap: [{ id: PUBLISHED.id, display_order: 0 }, { id: 'ep-2', display_order: 5 }] }) }));
    expect(res.status).toBe(200);
    expect(episodes().map((e) => [e.id, e.display_order])).toEqual([[PUBLISHED.id, 5], ['ep-2', 0]]);
  });

  it('deletes a never-published draft, but asks to archive anything that has been public', async () => {
    episodes().push({ id: 'ep-draft', slug: 'draft', title: 'Draft', status: 'draft', published_at: null, display_order: 1 });
    const del = (id: string) => DELETE(new NextRequest(`http://localhost/api/admin/journal?id=${id}`, { method: 'DELETE' }));
    expect((await del('ep-draft')).status).toBe(200);
    expect((await del(PUBLISHED.id)).status).toBe(409);
    expect(episodes().map((e) => e.id)).toEqual([PUBLISHED.id]);
  });
});

describe('authorization', () => {
  it('refuses signed-out requests before touching the database', async () => {
    auth.result = { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
    for (const res of [
      await GET(),
      await post({ title: 'x', status: 'published' }),
      await DELETE(new NextRequest(`http://localhost/api/admin/journal?id=${PUBLISHED.id}`, { method: 'DELETE' })),
    ]) {
      expect(res.status).toBe(401);
    }
    expect(db.calls).toHaveLength(0);
  });
});
