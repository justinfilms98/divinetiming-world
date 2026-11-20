/**
 * Best-effort cleanup for storage objects uploaded in the current admin session
 * that never reached /register (cancel, network drop, or register failure).
 *
 * Safety model:
 * - requireAdmin (authenticated authorized admin + service client)
 * - each path must carry a server-issued HMAC ticket bound to this admin
 * - path shape must match upload-path's timestamped library/poster pattern
 * - refuse if referenced by the media library OR any known content table
 * - re-check references immediately before storage.remove (narrow register race)
 * - never broad prefix deletes; remove is idempotent for missing objects
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  parseAbandonTicketClaims,
  verifyAbandonTicket,
} from '@/lib/media/abandonTicket';
import { isAbandonableUploadPath } from '@/lib/media/abandonUploads';
import { findReferencedMediaPaths } from '@/lib/media/mediaReferenceGuard';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const adminEmail = auth.user!.email;

  try {
    const body = await request.json().catch(() => ({}));
    const claims = parseAbandonTicketClaims(body?.tickets);
    if (claims.length === 0) {
      return NextResponse.json({ ok: true, removed: [], skipped: 'no_tickets' });
    }

    const allowed: string[] = [];
    const denied: Array<{ path: string; reason: string }> = [];
    const seen = new Set<string>();

    for (const claim of claims) {
      const verified = verifyAbandonTicket(claim, adminEmail);
      if (!verified.ok) {
        denied.push({ path: typeof claim.path === 'string' ? claim.path : '', reason: verified.reason });
        continue;
      }
      if (!isAbandonableUploadPath(verified.path)) {
        denied.push({ path: verified.path, reason: 'invalid_path' });
        continue;
      }
      if (seen.has(verified.path)) continue;
      seen.add(verified.path);
      allowed.push(verified.path);
    }

    if (allowed.length === 0) {
      return NextResponse.json({ ok: true, removed: [], denied, skipped: 'no_authorized_paths' });
    }

    let referenced: Set<string>;
    try {
      referenced = await findReferencedMediaPaths(supabase, allowed);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Could not verify media references before cleanup.', removed: [], denied },
        { status: 500 }
      );
    }

    let toRemove = allowed.filter((p) => !referenced.has(p));
    for (const path of allowed) {
      if (referenced.has(path)) denied.push({ path, reason: 'referenced' });
    }

    if (toRemove.length === 0) {
      return NextResponse.json({ ok: true, removed: [], denied, skipped: 'all_referenced_or_denied' });
    }

    // Narrow the register-vs-cleanup race: re-check immediately before delete.
    let referencedAgain: Set<string>;
    try {
      referencedAgain = await findReferencedMediaPaths(supabase, toRemove);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Could not re-verify media references before cleanup.', removed: [], denied },
        { status: 500 }
      );
    }
    for (const path of [...toRemove]) {
      if (referencedAgain.has(path)) {
        denied.push({ path, reason: 'referenced' });
        toRemove = toRemove.filter((p) => p !== path);
      }
    }

    if (toRemove.length === 0) {
      return NextResponse.json({ ok: true, removed: [], denied, skipped: 'all_referenced_or_denied' });
    }

    const { data, error } = await supabase.storage.from('media').remove(toRemove);
    if (error) {
      console.error('abandon-uploads remove error:', error);
      return NextResponse.json(
        {
          ok: false,
          error: 'Could not clean up abandoned upload files.',
          removed: [],
          denied,
          attempted: toRemove,
        },
        { status: 500 }
      );
    }

    const removed = Array.isArray(data)
      ? data.map((row) => (typeof row?.name === 'string' ? row.name : '')).filter(Boolean)
      : toRemove;

    return NextResponse.json({ ok: true, removed, denied });
  } catch (err) {
    console.error('abandon-uploads error:', err);
    return NextResponse.json({ ok: false, error: 'Could not clean up abandoned upload files.' }, { status: 500 });
  }
}
