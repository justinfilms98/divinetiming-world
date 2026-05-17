import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractFolderIdFromUrl } from '@/lib/integrations/googleDrive';

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
    const folderUrl = body.folderUrl as string;
    if (!folderUrl) {
      return NextResponse.json({ error: 'folderUrl required' }, { status: 400 });
    }

    const folderId = extractFolderIdFromUrl(folderUrl);
    if (!folderId) {
      return NextResponse.json({ ok: false, error: 'Invalid folder URL' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, folderId });
  } catch (err) {
    console.error('Google Drive folder parse error:', err);
    return NextResponse.json({ error: 'Failed to parse folder' }, { status: 500 });
  }
}
