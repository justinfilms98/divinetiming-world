import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabasePublicObjectUrl } from '@/lib/storageUrls';

const BUCKET = 'media';

const SLOT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const SLOT_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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

  const supabase = supabaseAdmin();

  try {
    const formData = await request.formData();
    const page_slug = formData.get('page_slug');
    const slot_index = formData.get('slot_index');
    const kind = formData.get('kind');
    const file = formData.get('file');

    if (!page_slug || typeof page_slug !== 'string' || !slot_index || typeof slot_index !== 'string' || !kind || typeof kind !== 'string' || !file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing page_slug, slot_index, kind, or file' }, { status: 400 });
    }
    if (kind !== 'image' && kind !== 'video' && kind !== 'poster') {
      return NextResponse.json({ error: 'kind must be image, video, or poster' }, { status: 400 });
    }

    const slug = page_slug.trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: 'Invalid page_slug' }, { status: 400 });

    const slotNum = parseInt(slot_index, 10);
    if (slotNum < 1 || slotNum > 3) return NextResponse.json({ error: 'slot_index must be 1, 2, or 3' }, { status: 400 });

    const mime = file.type;
    if (kind === 'image' || kind === 'poster') {
      if (!SLOT_IMAGE_TYPES.includes(mime as (typeof SLOT_IMAGE_TYPES)[number])) {
        return NextResponse.json({ error: 'Allowed image types: image/png, image/jpeg, image/webp' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
      }
    } else {
      if (!SLOT_VIDEO_TYPES.includes(mime as (typeof SLOT_VIDEO_TYPES)[number])) {
        return NextResponse.json({ error: 'Allowed video types: video/mp4, video/webm' }, { status: 400 });
      }
      if (file.size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ error: 'Video must be under 100MB' }, { status: 400 });
      }
    }

    const ext = getExt(file.name, mime);
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80) || 'file';
    const storagePath = `hero/${slug}/slot-${slotNum}/${timestamp}-${safeName}.${ext}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: mime, upsert: true });

    if (uploadError) {
      console.error('Hero slot storage upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
    }

    const public_url = supabasePublicObjectUrl(storagePath) ?? '';
    return NextResponse.json({ storage_path: storagePath, public_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    console.error('Hero slot upload error:', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
