import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';
import { issueAbandonTicket } from '@/lib/media/abandonTicket';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));

const { POST } = await import('./route');

let db: FakeDb;
let supabase: ReturnType<typeof fakeSupabase>;

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/admin/media/abandon-uploads', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', 'test-session-secret-32chars-min!!');
  db = createFakeDb({
    external_media_assets: [
      {
        id: 'asset-1',
        file_id: 'library/1795100000000-owner-photo.jpg',
        preview_url:
          'https://example.supabase.co/storage/v1/object/public/media/library/1795100000000-owner-photo.jpg',
        thumbnail_url: null,
      },
      {
        id: 'asset-2',
        file_id: 'library/1795100000001-owner-video.mp4',
        preview_url:
          'https://example.supabase.co/storage/v1/object/public/media/library/1795100000001-owner-video.mp4',
        thumbnail_url:
          'https://example.supabase.co/storage/v1/object/public/media/library/posters/1795100000002-owner-poster.jpg',
      },
    ],
  });
  supabase = fakeSupabase(db);
  auth.result = { supabase, user: { email: 'owner@example.com' } };
});

describe('POST /api/admin/media/abandon-uploads', () => {
  it('refuses signed-out callers before touching storage', async () => {
    auth.result = { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    const ticket = issueAbandonTicket('library/1795200000000-temp.jpg', 'owner@example.com')!;
    const res = await post({ tickets: [ticket] });
    expect(res.status).toBe(401);
    expect(supabase.__removed).toHaveLength(0);
  });

  it('deletes a ticketed pending path for the issuing admin', async () => {
    const ticket = issueAbandonTicket('library/1795200000000-temp.jpg', 'owner@example.com')!;
    const res = await post({ tickets: [ticket] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.removed).toContain('library/1795200000000-temp.jpg');
    expect(supabase.__removed).toEqual([['library/1795200000000-temp.jpg']]);
  });

  it('rejects forged tickets and foreign admin tickets', async () => {
    const foreign = issueAbandonTicket('library/1795200000000-temp.jpg', 'other@example.com')!;
    const forged = { ...issueAbandonTicket('library/1795200000000-temp.jpg', 'owner@example.com')!, sig: 'aa'.repeat(32) };
    const res = await post({ tickets: [foreign, forged] });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.removed).toEqual([]);
    expect(supabase.__removed).toHaveLength(0);
    expect(body.denied?.length).toBeGreaterThan(0);
  });

  it('rejects malicious path shapes even with a matching-looking ticket claim', async () => {
    const ticket = issueAbandonTicket('library/../secret.jpg', 'owner@example.com');
    // issueAbandonTicket still signs whatever path — verify path filter blocks it
    expect(ticket).not.toBeNull();
    const res = await post({ tickets: [ticket!] });
    const body = await res.json();
    expect(body.removed ?? []).toEqual([]);
    expect(supabase.__removed).toHaveLength(0);
  });

  it('will not delete a registered owner file_id even with a valid ticket', async () => {
    const path = 'library/1795100000000-owner-photo.jpg';
    const ticket = issueAbandonTicket(path, 'owner@example.com')!;
    const res = await post({ tickets: [ticket] });
    const body = await res.json();
    expect(body.removed).toEqual([]);
    expect(body.denied).toEqual(expect.arrayContaining([expect.objectContaining({ path, reason: 'registered' })]));
    expect(supabase.__removed).toHaveLength(0);
  });

  it('will not delete a registered poster referenced only via thumbnail_url', async () => {
    const path = 'library/posters/1795100000002-owner-poster.jpg';
    const ticket = issueAbandonTicket(path, 'owner@example.com')!;
    const res = await post({ tickets: [ticket] });
    const body = await res.json();
    expect(body.removed).toEqual([]);
    expect(body.denied).toEqual(expect.arrayContaining([expect.objectContaining({ path, reason: 'registered' })]));
    expect(supabase.__removed).toHaveLength(0);
  });

  it('is idempotent when storage has nothing to remove', async () => {
    const ticket = issueAbandonTicket('library/1795200000099-gone.jpg', 'owner@example.com')!;
    const first = await post({ tickets: [ticket] });
    expect((await first.json()).ok).toBe(true);
    const second = await post({ tickets: [ticket] });
    expect((await second.json()).ok).toBe(true);
    expect(supabase.__removed.length).toBeGreaterThanOrEqual(1);
  });

  it('does not accept bare paths without tickets', async () => {
    const res = await post({ paths: ['library/1795200000000-temp.jpg'] });
    const body = await res.json();
    expect(body.skipped).toBe('no_tickets');
    expect(supabase.__removed).toHaveLength(0);
  });
});
