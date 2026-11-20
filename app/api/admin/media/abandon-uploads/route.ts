/**
 * Best-effort cleanup for storage objects uploaded in the current admin session
 * that never reached /register (cancel, network drop, or register failure).
 *
 * Safety model:
 * - requireAdmin (authenticated authorized admin + service client)
 * - each path must carry a server-issued HMAC ticket bound to this admin
 * - path shape must match upload-path's timestamped library/poster pattern
 * - refuse if the object is already registered (file_id / preview / thumbnail)
 * - never broad prefix deletes; remove is idempotent for missing objects
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  parseAbandonTicketClaims,
  verifyAbandonTicket,
} from '@/lib/media/abandonTicket';
import { isAbandonableUploadPath, mediaUrlPointsAtPath } from '@/lib/media/abandonUploads';

async function pathsRegisteredInLibrary(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>,
  paths: string[]
): Promise<Set<string>> {
  const registered = new Set<string>();
  if (!paths.length) return registered;

  const { data: byFileId, error: fileIdError } = await supabase
    .from('external_media_assets')
    .select('file_id')
    .in('file_id', paths);
  if (fileIdError) {
    console.error('abandon-uploads file_id lookup error:', fileIdError);
    throw new Error('library_lookup_failed');
  }
  for (const row of byFileId || []) {
    if (typeof row.file_id === 'string') registered.add(row.file_id);
  }

  // Posters usually live only on thumbnail_url of a video row (no own file_id row).
  for (const path of paths) {
    if (registered.has(path)) continue;
    const { data: urlRows, error: urlError } = await supabase
      .from('external_media_assets')
      .select('preview_url, thumbnail_url')
      .or(`preview_url.ilike.%${path}%,thumbnail_url.ilike.%${path}%`)
      .limit(20);
    if (urlError) {
      console.error('abandon-uploads url lookup error:', urlError);
      throw new Error('library_lookup_failed');
    }
    for (const row of urlRows || []) {
      if (mediaUrlPointsAtPath(row.preview_url, path) || mediaUrlPointsAtPath(row.thumbnail_url, path)) {
        registered.add(path);
        break;
      }
    }
  }

  return registered;
}

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

    let registered: Set<string>;
    try {
      registered = await pathsRegisteredInLibrary(supabase, allowed);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Could not verify library ownership before cleanup.', removed: [], denied },
        { status: 500 }
      );
    }

    const toRemove = allowed.filter((p) => !registered.has(p));
    for (const path of allowed) {
      if (registered.has(path)) denied.push({ path, reason: 'registered' });
    }

    if (toRemove.length === 0) {
      return NextResponse.json({ ok: true, removed: [], denied, skipped: 'all_registered_or_denied' });
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
