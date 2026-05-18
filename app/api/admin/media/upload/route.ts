import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getServiceClient } from '@/lib/supabase/service';

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const base = sanitize(file.name.replace(/\.[^.]+$/, '') || 'file');
    const path = `library/${Date.now()}-${base}.${ext}`;

    const supabase = getServiceClient();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const publicUrl = urlData?.publicUrl ?? '';

    const isImage = file.type.startsWith('image/');
    const row = {
      provider: 'supabase',
      file_id: path,
      preview_url: publicUrl,
      thumbnail_url: isImage ? publicUrl : null,
      name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data: asset, error: dbError } = await supabase
      .from('external_media_assets')
      .insert(row)
      .select()
      .single();

    if (dbError) {
      console.error('DB register error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      assets: [{
        id: asset.id,
        preview_url: publicUrl,
        provider: 'supabase',
        name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      }]
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    console.error('Upload error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}