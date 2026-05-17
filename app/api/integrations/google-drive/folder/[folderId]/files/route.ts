import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listFiles } from '@/lib/integrations/googleDrive';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
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

    const { folderId } = await params;
    if (!folderId) {
      return NextResponse.json({ error: 'folderId required' }, { status: 400 });
    }

    const result = await listFiles(folderId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to list files' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'image' | 'video' | null
    const sort = searchParams.get('sort') || 'name'; // 'name' | 'date'
    const q = searchParams.get('q')?.toLowerCase(); // search

    let files = result.files;
    if (filter === 'image') files = files.filter((f) => f.media_type === 'image');
    else if (filter === 'video') files = files.filter((f) => f.media_type === 'video');
    if (q) files = files.filter((f) => f.name.toLowerCase().includes(q));

    if (sort === 'date') {
      // We don't have date from list - keep name order
    }

    return NextResponse.json({ files });
  } catch (err: any) {
    console.error('Google Drive list files error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list files' },
      { status: 500 }
    );
  }
}
