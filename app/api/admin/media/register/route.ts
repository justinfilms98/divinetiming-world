import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { sanitizeReportedDimensions } from '@/lib/media/imageMeta';
import { isStillPosterUrl } from '@/lib/media/videoPoster';
import { orientationFromDimensions } from '@/lib/media/types';

interface SupabaseRegisterFile {
  storage_path: string;
  public_url: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  /** Still image URL for videos (JPEG/WebP poster). Ignored for images (they use public_url). */
  thumbnail_url?: string | null;
}

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Accept only same-project storage URLs under media/library (incl. posters). */
function isAllowedThumbnailUrl(url: string, mediaPublicUrl: string): boolean {
  if (!isHttpsUrl(url) || !isStillPosterUrl(url)) return false;
  try {
    const thumb = new URL(url);
    const media = new URL(mediaPublicUrl);
    if (thumb.origin !== media.origin) return false;
    return /\/storage\/v1\/object\/public\/media\/library\//.test(thumb.pathname);
  } catch {
    return false;
  }
}

function sanitizeSize(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) return null;
  if (value > 2 * 1024 * 1024 * 1024) return null;
  return value;
}

/**
 * Register Supabase storage uploads in external_media_assets.
 * Upload flow: client uploads to Supabase bucket → this API → DB row with provider 'supabase'.
 *
 * Schema note: there is no duration_seconds column. Video duration measured client-side is not stored.
 * original vs optimized size: size_bytes records the uploaded (usually optimized) object only.
 */
export async function POST(request: NextRequest) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY) {
    console.warn('[Phase 17.C] Remove NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY from .env; it is no longer used.');
  }
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const provider = body?.provider ?? 'supabase';
    const files = body?.files ?? (Array.isArray(body) ? body : body?.payload);

    if (provider !== 'supabase') {
      return NextResponse.json({ error: 'Only provider "supabase" is supported for new uploads' }, { status: 400 });
    }
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({
        error:
          'Payload must be { provider: "supabase", files: [{ storage_path, public_url, name?, mimeType?, size?, width?, height?, thumbnail_url? }] }',
      }, { status: 400 });
    }

    const validated: SupabaseRegisterFile[] = [];
    for (const f of files) {
      const storage_path = f.storage_path ?? f.storagePath;
      const public_url = f.public_url ?? f.preview_url ?? f.cdnUrl;
      if (!storage_path || typeof storage_path !== 'string' || !public_url || typeof public_url !== 'string') {
        return NextResponse.json({ error: 'Each file must have storage_path and public_url' }, { status: 400 });
      }
      if (!storage_path.startsWith('library/')) {
        return NextResponse.json({ error: 'storage_path must be under library/' }, { status: 400 });
      }
      if (!isHttpsUrl(public_url)) {
        return NextResponse.json({ error: 'public_url must be an https URL' }, { status: 400 });
      }

      const dims = sanitizeReportedDimensions(f.width, f.height);
      const size = sanitizeSize(f.size ?? f.size_bytes);
      const mimeType = typeof (f.mimeType ?? f.mime_type) === 'string' ? String(f.mimeType ?? f.mime_type) : null;
      const isImage = (mimeType || '').toLowerCase().startsWith('image/');
      const isVideo = (mimeType || '').toLowerCase().startsWith('video/');

      let thumbnail_url: string | null = null;
      if (isImage) {
        thumbnail_url = public_url;
      } else if (isVideo && typeof f.thumbnail_url === 'string' && f.thumbnail_url) {
        if (!isAllowedThumbnailUrl(f.thumbnail_url, public_url)) {
          return NextResponse.json(
            { error: 'thumbnail_url must be an https still image on this project’s media/library storage.' },
            { status: 400 }
          );
        }
        thumbnail_url = f.thumbnail_url;
      }

      validated.push({
        storage_path,
        public_url,
        name: typeof (f.name ?? f.originalFilename) === 'string' ? (f.name ?? f.originalFilename) : null,
        mimeType,
        size,
        width: dims.width,
        height: dims.height,
        thumbnail_url,
      });
    }

    const inserted: Array<Record<string, unknown>> = [];

    for (const f of validated) {
      const isImage = (f.mimeType || '').toLowerCase().startsWith('image/');
      const row = {
        provider: 'supabase',
        file_id: f.storage_path,
        preview_url: f.public_url,
        thumbnail_url: f.thumbnail_url ?? (isImage ? f.public_url : null),
        name: f.name ?? null,
        mime_type: f.mimeType ?? null,
        size_bytes: f.size ?? null,
        width: f.width ?? null,
        height: f.height ?? null,
        orientation: orientationFromDimensions(f.width, f.height),
        // New uploads stay off public listings (e.g. the Videos tab) until an admin sets Usage to Public.
        usage_type: 'internal' as const,
        is_archived: false,
        is_featured: false,
        tags: [] as string[],
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('external_media_assets')
        .select('id')
        .eq('provider', 'supabase')
        .eq('file_id', f.storage_path)
        .maybeSingle();

      if (existing?.id) {
        const { usage_type: _usage, is_archived: _archived, is_featured: _featured, tags: _tags, ...refresh } = row;
        const { data: updated, error } = await supabase
          .from('external_media_assets')
          .update(refresh)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) {
          console.error('Register media update error:', error);
          return NextResponse.json({ error: error.message || 'Failed to update library entry.' }, { status: 500 });
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
          return NextResponse.json({ error: error.message || 'Failed to add file to library.' }, { status: 500 });
        }
        inserted.push(created);
      }
    }

    return NextResponse.json({ assets: inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Register media error:', err);
    return NextResponse.json({ error: msg && msg.length < 200 ? msg : 'Failed to register files. Check server logs.' }, { status: 500 });
  }
}
