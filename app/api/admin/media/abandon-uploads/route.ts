/**
 * Best-effort cleanup for storage objects uploaded in the current session that
 * never reached /register (cancel, network drop, or register failure).
 *
 * Only deletes exact paths the client lists. Paths must match the immutable
 * timestamped library/poster pattern from upload-path — never a broad wipe.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { filterAbandonablePaths } from '@/lib/media/abandonUploads';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json().catch(() => ({}));
    const paths = filterAbandonablePaths(body?.paths);
    if (paths.length === 0) {
      return NextResponse.json({ ok: true, removed: [], skipped: 'no_valid_paths' });
    }

    const { data, error } = await supabase.storage.from('media').remove(paths);
    if (error) {
      console.error('abandon-uploads remove error:', error);
      return NextResponse.json(
        { ok: false, error: 'Could not clean up abandoned upload files.', removed: [] },
        { status: 500 }
      );
    }

    const removed = Array.isArray(data) ? data.map((row) => row.name).filter(Boolean) : paths;
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    console.error('abandon-uploads error:', err);
    return NextResponse.json({ ok: false, error: 'Could not clean up abandoned upload files.' }, { status: 500 });
  }
}
