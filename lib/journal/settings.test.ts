import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const row = vi.hoisted(() => ({ result: { data: null as unknown, error: null as unknown }, throws: false }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    if (row.throws) throw new Error('no cookies');
    return { from: () => ({ select: () => ({ maybeSingle: async () => row.result }) }) };
  },
}));

const { isJournalPublic } = await import('./settings');

describe('isJournalPublic (server-side switch)', () => {
  beforeEach(() => {
    row.throws = false;
  });

  it('is on only when the switch row says so', async () => {
    row.result = { data: { public_enabled: true }, error: null };
    expect(await isJournalPublic()).toBe(true);
  });

  it.each([
    ['switched off', { data: { public_enabled: false }, error: null }],
    ['no row', { data: null, error: null }],
    ['table missing (before migration 061)', { data: null, error: { code: '42P01', message: 'relation does not exist' } }],
    ['unexpected value', { data: { public_enabled: 'true' }, error: null }],
  ])('is off when %s', async (_name, result) => {
    row.result = result;
    expect(await isJournalPublic()).toBe(false);
  });

  it('is off if the database client fails', async () => {
    row.throws = true;
    expect(await isJournalPublic()).toBe(false);
  });
});
