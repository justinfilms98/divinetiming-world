import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

interface RegisterFile {
  uuid: string;
  cdnUrl: string;
  originalFilename?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Register Uploadcare uploads in external_media_assets.
 * Single path: Uploadcare → uuid + cdnUrl → this API → DB row.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const files = Array.isArray(body) ? body : body?.files ?? body?.payload;
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Payload must be an array of { uuid, cdnUrl, originalFilename?, mimeType?, size? }' }, { status: 400 });
    }

    const validated: RegisterFile[] = [];
    for (const f of files) {
      const uuid = f.uuid ?? f.provider_id;
      const cdnUrl = f.cdnUrl ?? f.cdn_url ?? f.preview_url;
      if (!uuid || typeof uuid !== 'string' || !cdnUrl || typeof cdnUrl !== 'string') {
        return NextResponse.json({ error: 'Each item must have uuid and cdnUrl' }, { status: 400 });
      }
      if (!cdnUrl.includes('ucarecdn.com') && !cdnUrl.includes('ucarecdn.net')) {
        return NextResponse.json({ error: 'cdnUrl must be an Uploadcare CDN URL (ucarecdn.com or ucarecdn.net)' }, { status: 400 });
      }
      validated.push({
        uuid,
        cdnUrl,
        originalFilename: f.originalFilename ?? f.name ?? null,
        mimeType: f.mimeType ?? f.mime_type ?? null,
        size: f.size ?? f.size_bytes ?? null,
      });
    }

    const inserted: Array<{
      id: string;
      provider: string;
      file_id: string;
      preview_url: string;
      thumbnail_url: string | null;
      name: string | null;
      mime_type: string | null;
      size_bytes: number | null;
      created_at?: string;
    }> = [];

    for (const f of validated) {
      const isImage = (f.mimeType || '').toLowerCase().startsWith('image/');
      const row = {
        provider: 'uploadcare',
        file_id: f.uuid,
        preview_url: f.cdnUrl,
        thumbnail_url: isImage ? f.cdnUrl : null,
        name: f.originalFilename ?? null,
        mime_type: f.mimeType ?? null,
        size_bytes: f.size ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('external_media_assets')
        .select('id')
        .eq('provider', 'uploadcare')
        .eq('file_id', f.uuid)
        .maybeSingle();

      if (existing?.id) {
        const { data: updated, error } = await supabase
          .from('external_media_assets')
          .update(row)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) {
          console.error('Register media update error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        inserted.push(updated);
      } else {
        const { data: created, error } = await supabase
          .from('external_media_assets')
          .insert({ ...row, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) {
          console.error('Register media insert error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        inserted.push(created);
      }
    }

    return NextResponse.json({ assets: inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Register media error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
