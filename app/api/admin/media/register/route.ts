import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

interface SupabaseRegisterFile {
  storage_path: string;
  public_url: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Register Supabase storage uploads in external_media_assets.
 * Upload flow: client uploads to Supabase bucket → this API → DB row with provider 'supabase'.
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
        error: 'Payload must be { provider: "supabase", files: [{ storage_path, public_url, name?, mimeType?, size? }] }',
      }, { status: 400 });
    }

    const validated: SupabaseRegisterFile[] = [];
    for (const f of files) {
      const storage_path = f.storage_path ?? f.storagePath;
      const public_url = f.public_url ?? f.preview_url ?? f.cdnUrl;
      if (!storage_path || typeof storage_path !== 'string' || !public_url || typeof public_url !== 'string') {
        return NextResponse.json({ error: 'Each file must have storage_path and public_url' }, { status: 400 });
      }
      validated.push({
        storage_path,
        public_url,
        name: f.name ?? f.originalFilename ?? null,
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
        provider: 'supabase',
        file_id: f.storage_path,
        preview_url: f.public_url,
        thumbnail_url: isImage ? f.public_url : null,
        name: f.name ?? null,
        mime_type: f.mimeType ?? null,
        size_bytes: f.size ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('external_media_assets')
        .select('id')
        .eq('provider', 'supabase')
        .eq('file_id', f.storage_path)
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
          return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
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
          return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
        }
        inserted.push(created);
      }
    }

    return NextResponse.json({ assets: inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Register media error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
