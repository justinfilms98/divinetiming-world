import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getImageUrl, getThumbnailUrl, getVideoPreviewUrl } from '@/lib/integrations/googleDrive';

/**
 * Create an external_media_asset from a Drive file selection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();
    if (!data) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { file_id, name, mime_type, size_bytes, thumbnail_url, web_view_link, source_folder_id } = body;

    if (!file_id) {
      return NextResponse.json({ error: 'file_id required' }, { status: 400 });
    }

    const isVideo = mime_type?.toLowerCase().startsWith('video/');
    const preview_url = isVideo ? getVideoPreviewUrl(file_id) : getImageUrl(file_id);
    const thumb = thumbnail_url || getThumbnailUrl(file_id);

    const { data: asset, error } = await supabase
      .from('external_media_assets')
      .insert({
        provider: 'google_drive',
        file_id,
        name: name || null,
        mime_type: mime_type || null,
        size_bytes: size_bytes ? parseInt(size_bytes, 10) : null,
        thumbnail_url: thumb,
        preview_url,
        web_view_link: web_view_link || null,
        source_folder_id: source_folder_id || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asset });
  } catch (err: any) {
    console.error('Create external asset error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
