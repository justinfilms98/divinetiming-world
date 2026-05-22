/**
 * Issues a one-shot signed upload URL so the browser can PUT the file body
 * directly to Supabase Storage without needing its own authenticated session.
 *
 * Why: the browser client may not always have the same Supabase Auth session
 * as the server (cookie/session-strategy edge cases on Vercel). When the
 * browser uploaded with its own anon/auth client we hit
 * `new row violates row-level security policy` on storage.objects.
 *
 * Server-side createSignedUploadUrl uses the service role, so RLS is bypassed
 * and the returned signed URL is good for a single upload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { supabasePublicObjectUrl } from '@/lib/storageUrls';

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const filename = typeof body?.filename === 'string' ? body.filename : 'upload';
    const ext = filename.split('.').pop()?.toLowerCase() || 'bin';
    const base = sanitize(filename.replace(/\.[^.]+$/, '') || 'file');
    const path = `library/${Date.now()}-${base}.${ext}`;

    const { data, error } = await auth.supabase!.storage
      .from('media')
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error('Signed upload URL error:', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to create signed upload URL' },
        { status: 500 },
      );
    }

    const publicUrl = supabasePublicObjectUrl(path) ?? '';
    return NextResponse.json({
      path: data.path ?? path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl,
    });
  } catch (err) {
    console.error('Upload path error:', err);
    return NextResponse.json({ error: 'Failed to generate path' }, { status: 500 });
  }
}
