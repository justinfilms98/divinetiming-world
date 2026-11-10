import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { POST, PATCH } = await import('@/app/api/admin/journey-blocks/route');

let db: FakeDb;

function req(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/admin/journey-blocks', {
    method,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  db = createFakeDb({
    journey_blocks: [
      { id: 'a', title: 'Divine timing', display_order: 0, status: 'published' },
      { id: 'b', title: 'The land', display_order: 1, status: 'published' },
    ],
  });
  auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
});

describe('PATCH /api/admin/journey-blocks (reorder)', () => {
  it('succeeds only when every chapter was updated', async () => {
    const res = await PATCH(req('PATCH', { items: [{ id: 'a', display_order: 1 }, { id: 'b', display_order: 0 }] }));
    expect(res.status).toBe(200);
    expect(db.tables.journey_blocks!.map((r) => [r.id, r.display_order])).toEqual([
      ['a', 1],
      ['b', 0],
    ]);
  });

  it('cannot report success when a database update fails', async () => {
    db.failOn = (op, _t, row) => (op === 'update' && row?.id === 'b' ? { message: 'connection reset' } : null);
    const res = await PATCH(req('PATCH', { items: [{ id: 'a', display_order: 1 }, { id: 'b', display_order: 0 }] }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBeUndefined();
    expect(json.failed).toEqual(['b']);
    expect(json.error).toMatch(/not fully saved \(1 of 2/);
  });

  it('cannot report success when a chapter no longer exists', async () => {
    const res = await PATCH(req('PATCH', { items: [{ id: 'gone', display_order: 0 }] }));
    expect(res.status).toBe(404);
    expect((await res.json()).missing).toEqual(['gone']);
  });

  it('rejects malformed items with 400', async () => {
    for (const body of [{}, { items: [] }, { items: [{ id: 'a', display_order: 'x' }] }, 'not json']) {
      expect((await PATCH(req('PATCH', body))).status).toBe(400);
    }
  });
});

describe('POST /api/admin/journey-blocks (save)', () => {
  it('returns 404 for a chapter that no longer exists', async () => {
    const res = await POST(req('POST', { id: 'gone', title: 'x' }));
    expect(res.status).toBe(404);
  });

  it('returns 500 (never success) when the update fails', async () => {
    db.failOn = (op) => (op === 'update' ? { message: 'boom' } : null);
    const res = await POST(req('POST', { id: 'a', title: 'x' }));
    expect(res.status).toBe(500);
  });

  it('returns the saved chapter so the editor can replace just that one', async () => {
    const res = await POST(req('POST', { id: 'b', title: 'The land', body: 'New text', status: 'published' }));
    expect(res.status).toBe(200);
    expect((await res.json()).block).toMatchObject({ id: 'b', body: 'New text' });
    expect(db.tables.journey_blocks!.find((r) => r.id === 'a')).toMatchObject({ title: 'Divine timing' });
  });

  it('refuses signed-out requests before touching the database', async () => {
    auth.result = { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    expect((await POST(req('POST', { id: 'a', title: 'x' }))).status).toBe(401);
    expect((await PATCH(req('PATCH', { items: [{ id: 'a', display_order: 3 }] }))).status).toBe(401);
    expect(db.calls).toHaveLength(0);
  });
});
