import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { POST } = await import('./route');

const EVENTS_ROW = { id: 'ps-events', page_slug: 'events', seo_title: 'Live', section_copy: null };
let db: FakeDb;
const row = () => db.tables.page_settings!.find((r) => r.page_slug === 'events')!;

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/admin/page-copy', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

beforeEach(() => {
  db = createFakeDb({ page_settings: [EVENTS_ROW, { id: 'ps-home', page_slug: 'home', section_copy: null }] });
  auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
});

describe('POST /api/admin/page-copy', () => {
  it('saves the Events text and merges later edits', async () => {
    let res = await post({ page_slug: 'events', section_copy: { past_title: 'The story so far', past_intro: 'Every gathering, from the first 50 to 600+' } });
    expect(res.status).toBe(200);
    res = await post({ page_slug: 'events', section_copy: { show_touring_summary: false } });
    expect(res.status).toBe(200);
    expect(row().section_copy).toEqual({
      past_title: 'The story so far',
      past_intro: 'Every gathering, from the first 50 to 600+',
      show_touring_summary: false,
    });
    expect(row().seo_title).toBe('Live');
  });

  it('an emptied field returns to the default wording', async () => {
    row().section_copy = { past_title: 'Old' };
    const res = await post({ page_slug: 'events', section_copy: { past_title: '' } });
    expect(res.status).toBe(200);
    expect(row().section_copy).toEqual({});
  });

  it.each([
    [{ page_slug: 'home', section_copy: { past_title: 'x' } }, /Only the Events page/],
    [{ page_slug: 'events', section_copy: { past_intro: '<b>x</b>' } }, /< or >/],
    [{ page_slug: 'events', section_copy: { nope: 'x' } }, /Unknown/],
  ])('rejects %j and changes nothing', async (body, message) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(message);
    expect(row().section_copy).toBeNull();
  });

  it('reports a missing migration without changing anything', async () => {
    db = createFakeDb({ page_settings: [{ id: 'ps-events', page_slug: 'events', seo_title: 'Live' }] });
    auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
    const res = await post({ page_slug: 'events', section_copy: { past_title: 'x' } });
    expect(res.status).toBe(409);
    expect(row()).toEqual({ id: 'ps-events', page_slug: 'events', seo_title: 'Live' });
  });

  it('refuses signed-out requests before touching the database', async () => {
    const { NextResponse } = await import('next/server');
    auth.result = { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    const res = await post({ page_slug: 'events', section_copy: { past_title: 'x' } });
    expect(res.status).toBe(401);
    expect(db.calls).toHaveLength(0);
  });
});
