/**
 * Server-side media upload to avoid storage RLS issues.
 * Uses service role so insert into storage.objects succeeds regardless of client RLS.
 * Client then registers via POST /api/admin/media/register.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabasePublicObjectUrl } from '@/lib/storageUrls';

const BUCKET = 'media';
const MAX_BYTES = 100 * 1024 * 1024;

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File must be under ${Math.round(MAX_BYTES / 1024 / 1024)}MB` }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const base = sanitize(file.name.replace(/\.[^.]+$/, '') || 'file');
    const storagePath = `library/${Date.now()}-${base}.${ext}`;

    const buffer = await file.arrayBuffer();
    const supabase = supabaseAdmin();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }

    const public_url = supabasePublicObjectUrl(storagePath) ?? '';
    return NextResponse.json({
      storage_path: storagePath,
      public_url,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
