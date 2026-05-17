/**
 * Returns a unique storage path for client-side direct upload to Supabase (hero slot media).
 * Avoids 413 on Vercel by never receiving the file body — client uploads directly to storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { supabasePublicObjectUrl } from '@/lib/storageUrls';

function getExt(name: string, mime: string): string {
  const fromName = name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'video/mp4') return 'mp4';
  if (mime === 'video/webm') return 'webm';
  return 'bin';
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const page_slug = typeof body?.page_slug === 'string' ? body.page_slug.trim().toLowerCase() : '';
    const slot_index = typeof body?.slot_index === 'string' ? body.slot_index : String(body?.slot_index ?? '1');
    const kind = typeof body?.kind === 'string' ? body.kind : 'image';
    const filename = typeof body?.filename === 'string' ? body.filename : 'file';

    if (!page_slug) {
      return NextResponse.json({ error: 'Missing or invalid page_slug' }, { status: 400 });
    }
    const slotNum = parseInt(slot_index, 10);
    if (slotNum < 1 || slotNum > 3) {
      return NextResponse.json({ error: 'slot_index must be 1, 2, or 3' }, { status: 400 });
    }
    if (kind !== 'image' && kind !== 'video' && kind !== 'poster') {
      return NextResponse.json({ error: 'kind must be image, video, or poster' }, { status: 400 });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80) || 'file';
    const ext = getExt(filename, kind === 'video' ? 'video/mp4' : 'image/jpeg');
    const timestamp = Date.now();
    const path = `hero/${page_slug}/slot-${slotNum}/${timestamp}-${safeName}.${ext}`;
    const publicUrl = supabasePublicObjectUrl(path) ?? '';

    return NextResponse.json({ path, publicUrl });
  } catch (err) {
    console.error('Hero slot upload-path error:', err);
    return NextResponse.json({ error: 'Failed to generate path' }, { status: 500 });
  }
}
