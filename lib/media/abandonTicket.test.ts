import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ABANDON_TICKET_TTL_MS,
  issueAbandonTicket,
  parseAbandonTicketClaims,
  verifyAbandonTicket,
} from './abandonTicket';

describe('abandonTicket', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('issues and verifies a ticket for the same admin', () => {
    vi.stubEnv('SESSION_SECRET', 'test-session-secret-32chars-min!!');
    const ticket = issueAbandonTicket('library/1795200000000-shot.jpg', 'Owner@Example.com', 1_000_000);
    expect(ticket).not.toBeNull();
    expect(ticket!.exp).toBe(1_000_000 + ABANDON_TICKET_TTL_MS);
    const ok = verifyAbandonTicket(ticket!, 'owner@example.com', 1_000_100);
    expect(ok).toEqual({ ok: true, path: 'library/1795200000000-shot.jpg' });
  });

  it('rejects forged signatures and other admins', () => {
    vi.stubEnv('SESSION_SECRET', 'test-session-secret-32chars-min!!');
    const ticket = issueAbandonTicket('library/1795200000000-shot.jpg', 'a@example.com', 1_000_000)!;
    expect(verifyAbandonTicket({ ...ticket, sig: 'ab'.repeat(32) }, 'a@example.com', 1_000_100).ok).toBe(false);
    expect(verifyAbandonTicket(ticket, 'b@example.com', 1_000_100).ok).toBe(false);
  });

  it('rejects expired tickets', () => {
    vi.stubEnv('SESSION_SECRET', 'test-session-secret-32chars-min!!');
    const ticket = issueAbandonTicket('library/posters/1795200000000-p.jpg', 'a@example.com', 1_000_000)!;
    expect(verifyAbandonTicket(ticket, 'a@example.com', ticket.exp + 1).ok).toBe(false);
  });

  it('rejects path tampering that keeps the old signature', () => {
    vi.stubEnv('SESSION_SECRET', 'test-session-secret-32chars-min!!');
    const ticket = issueAbandonTicket('library/1795200000000-shot.jpg', 'a@example.com', 1_000_000)!;
    const tampered = { ...ticket, path: 'library/1795200000000-owner-hero.mp4' };
    expect(verifyAbandonTicket(tampered, 'a@example.com', 1_000_100).ok).toBe(false);
  });

  it('parses ticket claims defensively', () => {
    expect(parseAbandonTicketClaims(null)).toEqual([]);
    expect(parseAbandonTicketClaims([{ path: 'library/1-a.jpg', exp: 1, sig: 'abc' }])).toEqual([
      { path: 'library/1-a.jpg', exp: 1, sig: 'abc' },
    ]);
  });
});
