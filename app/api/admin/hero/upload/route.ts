import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabasePublicObjectUrl } from '@/lib/storageUrls';
import { HERO_UPLOAD_MAX_BYTES, HERO_ALLOWED_TYPES } from '@/lib/storageUpload';

const BUCKET = 'media';

function getExt(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'webp';
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = supabaseAdmin();

  try {
    const formData = await request.formData();
    const page_slug = formData.get('page_slug');
    const type = formData.get('type');
    const file = formData.get('file');

    if (!page_slug || typeof page_slug !== 'string' || !type || typeof type !== 'string' || !file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing page_slug, type, or file' }, { status: 400 });
    }
    if (type !== 'media' && type !== 'logo') {
      return NextResponse.json({ error: 'type must be media or logo' }, { status: 400 });
    }

    const slug = page_slug.trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: 'Invalid page_slug' }, { status: 400 });

    const mime = file.type;
    if (!HERO_ALLOWED_TYPES.includes(mime as (typeof HERO_ALLOWED_TYPES)[number])) {
      return NextResponse.json({ error: `Allowed types: ${HERO_ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }
    if (file.size > HERO_UPLOAD_MAX_BYTES) {
      return NextResponse.json({ error: `File must be under ${Math.round(HERO_UPLOAD_MAX_BYTES / 1024 / 1024)}MB` }, { status: 400 });
    }

    const ext = getExt(mime);
    const storagePath = type === 'logo'
      ? `hero/logos/${slug}-logo.${ext}`
      : `hero/${slug}.${ext}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: mime, upsert: true });

    if (uploadError) {
      console.error('Hero storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: existing } = await supabase
      .from('hero_sections')
      .select('id')
      .eq('page_slug', slug)
      .single();

    const column = type === 'logo' ? 'hero_logo_storage_path' : 'media_storage_path';

    if (existing) {
      const { error: upErr } = await supabase
        .from('hero_sections')
        .update({ [column]: storagePath, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    } else {
      const { error: insErr } = await supabase.from('hero_sections').insert({
        page_slug: slug,
        [column]: storagePath,
        media_type: type === 'media' ? 'image' : 'default',
        overlay_opacity: 0.4,
        animation_type: 'warp',
        animation_enabled: true,
        updated_at: new Date().toISOString(),
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const url = supabasePublicObjectUrl(storagePath);
    return NextResponse.json({ storagePath, url: url ?? '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    console.error('Hero upload error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
