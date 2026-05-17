/**
 * Returns a unique storage path for client-side direct upload to Supabase.
 * Avoids 413 on Vercel by never receiving the file body — client uploads directly to storage.
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
    const publicUrl = supabasePublicObjectUrl(path) ?? '';
    return NextResponse.json({ path, publicUrl });
  } catch (err) {
    console.error('Upload path error:', err);
    return NextResponse.json({ error: 'Failed to generate path' }, { status: 500 });
  }
}
