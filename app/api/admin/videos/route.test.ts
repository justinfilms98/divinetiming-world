import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { POST, DELETE } = await import('./route');

const LIVE = { id: 'v-live', title: 'Live set', youtube_id: 'dQw4w9WgXcQ', status: 'published', display_order: 0 };
const DRAFT = { id: 'v-draft', title: 'Rough cut', youtube_id: 'aaaaaaaaaaa', status: 'draft', display_order: 1 };
const ARCHIVED = { id: 'v-old', title: 'Old clip', youtube_id: 'bbbbbbbbbbb', status: 'archived', display_order: 2 };

let db: FakeDb;
const video = (id: string) => db.tables.videos!.find((v) => v.id === id)!;

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/admin/videos', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear();
  db = createFakeDb({ videos: [LIVE, DRAFT, ARCHIVED] });
  auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
});

describe('POST /api/admin/videos — new videos', () => {
  it('starts a new video as a draft when no status is sent (the Add form before this fix)', async () => {
    const res = await post({ title: 'New', youtube_id: 'https://youtu.be/ccccccccccc' });
    expect(res.status).toBe(200);
    const created = (await res.json()).video;
    expect(created).toMatchObject({ youtube_id: 'ccccccccccc', status: 'draft' });
  });

  it('publishes straight away only when asked to', async () => {
    const res = await post({ title: 'New', youtube_id: 'ccccccccccc', status: 'published' });
    expect((await res.json()).video.status).toBe('published');
  });

  it('rejects an unknown status and creates nothing', async () => {
    const res = await post({ title: 'New', youtube_id: 'ccccccccccc', status: 'live' });
    expect(res.status).toBe(400);
    expect(db.tables.videos).toHaveLength(3);
  });

  it('refreshes the Media page and the homepage Films section', async () => {
    await post({ title: 'New', youtube_id: 'ccccccccccc' });
    expect(vi.mocked(revalidatePath).mock.calls.map((c) => c[0]).sort()).toEqual(['/', '/media']);
  });
});

describe('POST /api/admin/videos — edits', () => {
  it.each([
    ['a draft', DRAFT.id, 'draft'],
    ['an archived video', ARCHIVED.id, 'archived'],
    ['a published video', LIVE.id, 'published'],
  ])('an edit without a status keeps %s as it was', async (_name, id, status) => {
    const res = await post({ id, title: 'Renamed', caption: 'New caption' });
    expect(res.status).toBe(200);
    expect(video(id)).toMatchObject({ title: 'Renamed', caption: 'New caption', status });
  });

  it('publishing, unpublishing and archiving still work', async () => {
    await post({ id: DRAFT.id, status: 'published' });
    expect(video(DRAFT.id).status).toBe('published');
    await post({ id: LIVE.id, status: 'draft' });
    expect(video(LIVE.id).status).toBe('draft');
    await post({ id: LIVE.id, status: 'archived' });
    expect(video(LIVE.id).status).toBe('archived');
  });

  it('rejects an unknown status on edit and changes nothing', async () => {
    const before = structuredClone(video(DRAFT.id));
    const res = await post({ id: DRAFT.id, title: 'Renamed', status: 'public' });
    expect(res.status).toBe(400);
    expect(video(DRAFT.id)).toEqual(before);
  });

  it('refreshes both pages after an edit and after a delete', async () => {
    await post({ id: LIVE.id, title: 'Renamed' });
    expect(vi.mocked(revalidatePath).mock.calls.map((c) => c[0]).sort()).toEqual(['/', '/media']);
    vi.mocked(revalidatePath).mockClear();
    const res = await DELETE(new NextRequest(`http://localhost/api/admin/videos?id=${ARCHIVED.id}`, { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(vi.mocked(revalidatePath).mock.calls.map((c) => c[0]).sort()).toEqual(['/', '/media']);
  });
});

describe('POST /api/admin/videos — authorization', () => {
  it('refuses signed-out requests before touching the database', async () => {
    const { NextResponse } = await import('next/server');
    auth.result = { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
    const res = await post({ title: 'New', youtube_id: 'ccccccccccc', status: 'published' });
    expect(res.status).toBe(401);
    expect(db.calls).toHaveLength(0);
    expect(db.tables.videos).toHaveLength(3);
  });
});
