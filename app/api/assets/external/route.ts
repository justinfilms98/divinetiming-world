import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server-role';

interface UploadcareFile {
  uuid: string;
  cdnUrl: string;
  mimeType: string;
  size?: number;
  name?: string;
}

/**
 * Create external_media_assets from Uploadcare file selections (batch)
 * Uses SERVICE ROLE to bypass RLS - auth is verified first via cookie client.
 */
export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data } = await authClient
      .from('admin_users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();
    if (!data) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = createServiceRoleClient();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SUPABASE_SERVICE_ROLE_KEY not configured';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const body = await request.json();
    const { provider, files } = body as { provider?: string; files?: UploadcareFile[] };

    if (provider !== 'uploadcare') {
      return NextResponse.json({ error: 'provider must be "uploadcare"' }, { status: 400 });
    }
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'files array required' }, { status: 400 });
    }

    const rows = files.map((f) => {
      const isImage = (f.mimeType || '').toLowerCase().startsWith('image/');
      return {
        provider: 'uploadcare',
        file_id: f.uuid,
        preview_url: f.cdnUrl,
        thumbnail_url: isImage ? f.cdnUrl : null,
        mime_type: f.mimeType || null,
        size_bytes: f.size ?? null,
        name: f.name || null,
        updated_at: new Date().toISOString(),
      };
    });

    const { data: assets, error } = await supabase
      .from('external_media_assets')
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Create external assets error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
