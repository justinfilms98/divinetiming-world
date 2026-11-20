/**
 * Server-issued abandon tickets bind a storage path to the admin who requested
 * the signed upload URL. Client-supplied paths alone are never proof of ownership.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/** How long a ticket remains valid for cleanup after upload-path issues it. */
export const ABANDON_TICKET_TTL_MS = 2 * 60 * 60 * 1000;

export type IssuedAbandonTicket = {
  path: string;
  exp: number;
  sig: string;
};

/**
 * Server-only signing material (never imported by client components).
 * Preference order:
 * 1. ABANDON_UPLOAD_HMAC_SECRET — dedicated key (recommended later; optional today)
 * 2. SESSION_SECRET — already configured for production/staging
 * 3. SUPABASE_SERVICE_ROLE_KEY — last-resort fallback; does not weaken auth by itself
 *    because this module never leaves the server, but a dedicated secret is preferred
 *    so cleanup signing is not coupled to the DB admin key.
 */
function abandonSecret(): string | null {
  const dedicated = process.env.ABANDON_UPLOAD_HMAC_SECRET;
  if (typeof dedicated === 'string' && dedicated.length >= 16) return dedicated;
  const session = process.env.SESSION_SECRET;
  if (typeof session === 'string' && session.length >= 16) return session;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof service === 'string' && service.length >= 16) return service;
  return null;
}

function payload(email: string, path: string, exp: number): string {
  return `${email.trim().toLowerCase()}\n${path}\n${exp}`;
}

function sign(secret: string, email: string, path: string, exp: number): string {
  return createHmac('sha256', secret).update(payload(email, path, exp)).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Issue a ticket for a path just created by upload-path for this admin. */
export function issueAbandonTicket(
  path: string,
  adminEmail: string,
  now = Date.now()
): IssuedAbandonTicket | null {
  const secret = abandonSecret();
  if (!secret || !adminEmail.trim() || !path) return null;
  const exp = now + ABANDON_TICKET_TTL_MS;
  return { path, exp, sig: sign(secret, adminEmail, path, exp) };
}

export type TicketVerifyResult =
  | { ok: true; path: string }
  | { ok: false; reason: 'missing_secret' | 'malformed' | 'expired' | 'forged' | 'email_mismatch' };

/**
 * Verify a ticket for the authenticated admin. Path inside the ticket must match
 * the claimed path (caller should also run path shape checks).
 */
export function verifyAbandonTicket(
  claim: { path: string; exp: unknown; sig: unknown },
  adminEmail: string,
  now = Date.now()
): TicketVerifyResult {
  const secret = abandonSecret();
  if (!secret) return { ok: false, reason: 'missing_secret' };

  const path = typeof claim.path === 'string' ? claim.path.trim() : '';
  const exp = typeof claim.exp === 'number' && Number.isFinite(claim.exp) ? claim.exp : NaN;
  const sig = typeof claim.sig === 'string' ? claim.sig.trim().toLowerCase() : '';
  if (!path || !sig || !Number.isFinite(exp)) return { ok: false, reason: 'malformed' };
  if (exp < now) return { ok: false, reason: 'expired' };

  const expected = sign(secret, adminEmail, path, exp).toLowerCase();
  if (!safeEqualHex(expected, sig)) return { ok: false, reason: 'forged' };
  return { ok: true, path };
}

export function parseAbandonTicketClaims(raw: unknown): Array<{ path: string; exp: unknown; sig: unknown }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ path: string; exp: unknown; sig: unknown }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.path !== 'string') continue;
    out.push({ path: rec.path, exp: rec.exp, sig: rec.sig });
  }
  return out;
}
